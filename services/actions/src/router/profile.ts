import { gql } from "@apollo/client/core";
import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { parseSessionVariables } from "@midspace/auth/middlewares/parse-session-variables";
import type { ActionPayload } from "@midspace/hasura/action";
import type {
    migrateProfilePhotoArgs,
    MigrateProfilePhotoResponse,
    updateProfilePhotoArgs,
    UpdateProfilePhotoResponse,
} from "@midspace/hasura/action-types";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { json } from "body-parser";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import pMemoize from "p-memoize";
import { assertType, TypeGuardError } from "typescript-is";
import type { Maybe } from "../generated/graphql";
import { MigrateProfilePhoto_GetRegistrantDocument, UpdateProfilePhotoDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3, SecretsManager } from "../lib/aws/awsClient";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(json());

gql`
    mutation UpdateProfilePhoto(
        $registrantId: uuid!
        $userId: String!
        $objectName: String = null
        $bucket: String = null
        $region: String = null
        $photoURL_50x50: String = null
        $photoURL_350x350: String = null
    ) {
        update_registrant_Profile(
            where: {
                _and: [
                    { registrantId: { _eq: $registrantId } }
                    {
                        registrant: {
                            _or: [{ userId: { _eq: $userId } }, { conference: { createdBy: { _eq: $userId } } }]
                        }
                    }
                ]
            }
            _set: {
                photoS3BucketName: $bucket
                photoS3BucketRegion: $region
                photoS3ObjectName: $objectName
                photoURL_50x50: $photoURL_50x50
                photoURL_350x350: $photoURL_350x350
                hasBeenEdited: true
            }
        ) {
            affected_rows
        }
    }

    query MigrateProfilePhoto_GetRegistrant($registrantId: uuid!) {
        registrant_Profile_by_pk(registrantId: $registrantId) {
            photoS3BucketName
            photoS3BucketRegion
            photoS3ObjectName
            registrant {
                userId
            }
        }
    }
`;

async function checkS3Url(
    url: string
): Promise<{ result: "success"; key: string } | { result: "error"; message: string }> {
    const { region, bucket, key } = AmazonS3URI(url);
    if (region !== process.env.AWS_REGION) {
        return { result: "error", message: "Invalid S3 URL (region mismatch)" };
    }
    if (bucket !== process.env.AWS_CONTENT_BUCKET_ID) {
        return { result: "error", message: "Invalid S3 URL (bucket mismatch)" };
    }
    if (!key) {
        return { result: "error", message: "Invalid S3 URL (missing key)" };
    }

    try {
        await S3.headObject({
            Bucket: bucket,
            Key: key,
        });
    } catch (e: any) {
        return {
            result: "error",
            message: "Could not retrieve object from S3",
        };
    }

    return { result: "success", key };
}

async function getImagesSecretValue(): Promise<string> {
    const response = await SecretsManager.send(
        new GetSecretValueCommand({
            SecretId: process.env.AWS_IMAGES_SECRET_ARN,
        })
    );

    const secretValue = response.SecretString;
    assert(secretValue);

    const secretJson = JSON.parse(secretValue);

    assert(secretJson["secret"]);
    return secretJson["secret"];
}

const getImagesSecretValueMemoized = pMemoize(getImagesSecretValue);

async function handleUpdateProfilePhoto(
    userId: string,
    registrantId: string,
    s3URL: Maybe<string> | undefined
): Promise<UpdateProfilePhotoResponse> {
    let photoURL_350x350: string | undefined;
    let photoURL_50x50: string | undefined;
    if (!s3URL || s3URL.length === 0) {
        await apolloClient.mutate({
            mutation: UpdateProfilePhotoDocument,
            variables: {
                registrantId,
                userId,
                bucket: null,
                objectName: null,
                region: null,
                photoURL_350x350: null,
                photoURL_50x50: null,
            },
        });
    } else {
        const validatedS3URL = await checkS3Url(s3URL);
        if (validatedS3URL.result === "error") {
            throw new Error("Invalid S3 URL");
        }

        assert(process.env.AWS_CONTENT_BUCKET_ID);

        ({ photoURL_350x350, photoURL_50x50 } = await updateProfilePhoto(
            validatedS3URL.key,
            registrantId,
            userId,
            process.env.AWS_CONTENT_BUCKET_ID
        ));
    }

    return {
        ok: true,
        photoURL_350x350,
        photoURL_50x50,
    };
}

async function updateProfilePhoto(key: string, registrantId: string, userId: string, bucketId: string) {
    assert(
        process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME,
        "AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME not provided."
    );
    assert(process.env.AWS_IMAGES_SECRET_ARN, "AWS_IMAGES_SECRET_ARN not provided.");

    const secret = await getImagesSecretValueMemoized();
    const photoURL_350x350 = generateSignedImageURL(
        process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME,
        secret,
        bucketId,
        key,
        350,
        350
    );
    const photoURL_50x50 = generateSignedImageURL(
        process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME,
        secret,
        bucketId,
        key,
        50,
        50
    );

    await apolloClient.mutate({
        mutation: UpdateProfilePhotoDocument,
        variables: {
            registrantId,
            userId,
            bucket: process.env.AWS_CONTENT_BUCKET_ID,
            objectName: key,
            region: process.env.AWS_REGION,
            photoURL_350x350,
            photoURL_50x50,
        },
    });
    return { photoURL_350x350, photoURL_50x50 };
}

async function handleMigrateProfilePhoto(registrantId: string): Promise<MigrateProfilePhotoResponse> {
    const result = await apolloClient.query({
        query: MigrateProfilePhoto_GetRegistrantDocument,
        variables: {
            registrantId,
        },
    });
    if (
        result.data.registrant_Profile_by_pk &&
        result.data.registrant_Profile_by_pk.registrant.userId &&
        result.data.registrant_Profile_by_pk.photoS3BucketName &&
        result.data.registrant_Profile_by_pk.photoS3BucketRegion &&
        result.data.registrant_Profile_by_pk.photoS3ObjectName
    ) {
        if (
            !result.data.registrant_Profile_by_pk.photoS3ObjectName.startsWith(
                result.data.registrant_Profile_by_pk.registrant.userId
            )
        ) {
            const key =
                result.data.registrant_Profile_by_pk.registrant.userId +
                "/" +
                result.data.registrant_Profile_by_pk.photoS3ObjectName;
            await S3.copyObject({
                Bucket: result.data.registrant_Profile_by_pk.photoS3BucketName,
                CopySource: result.data.registrant_Profile_by_pk.photoS3ObjectName,
                Key: key,
            });
            await updateProfilePhoto(
                key,
                registrantId,
                result.data.registrant_Profile_by_pk.registrant.userId,
                result.data.registrant_Profile_by_pk.photoS3BucketName
            );
            await S3.deleteObject({
                Bucket: result.data.registrant_Profile_by_pk.photoS3BucketName,
                Key: result.data.registrant_Profile_by_pk.photoS3ObjectName,
            });
        }
    }

    return {
        ok: true,
    };
}

router.post(
    "/photo/update",
    parseSessionVariables,
    async (req: Request, res: Response<UpdateProfilePhotoResponse>, next: NextFunction) => {
        try {
            const body = assertType<ActionPayload<updateProfilePhotoArgs>>(req.body);
            if (!req.userId) {
                throw new BadRequestError("Invalid request", { privateMessage: "No User ID available" });
            }
            const result = await handleUpdateProfilePhoto(req.userId, body.input.registrantId, body.input.s3URL);
            res.status(200).json(result);
        } catch (err: unknown) {
            if (err instanceof TypeGuardError) {
                next(new BadRequestError("Invalid request", { originalError: err }));
            } else if (err instanceof Error) {
                next(err);
            } else {
                next(new UnexpectedServerError("Server error", undefined, err));
            }
        }
    }
);

router.post("/photo/migrate", async (req: Request, res: Response<MigrateProfilePhotoResponse>, next: NextFunction) => {
    try {
        const body = assertType<ActionPayload<migrateProfilePhotoArgs>>(req.body);
        const result = await handleMigrateProfilePhoto(body.input.registrantId);
        res.status(200).json(result);
    } catch (err: unknown) {
        if (err instanceof TypeGuardError) {
            next(new BadRequestError("Invalid request", { originalError: err }));
        } else if (err instanceof Error) {
            next(err);
        } else {
            next(new UnexpectedServerError("Server error", undefined, err));
        }
    }
});

function btoa(str: string) {
    return Buffer.from(str, "binary").toString("base64");
}

function generateSignedImageURL(
    cloudFrontDistributionName: string,
    secret: string,
    bucketName: string,
    objectName: string,
    width: number,
    height: number
): string {
    const imageRequest = JSON.stringify({
        bucket: bucketName,
        key: objectName,
        edits: {
            resize: {
                width,
                height,
                fit: "cover",
            },
        },
    });

    const path = `/${btoa(imageRequest)}`;
    assert(secret);
    const signature = crypto.createHmac("sha256", secret).update(path).digest("hex");
    return `https://${cloudFrontDistributionName}.cloudfront.net${path}?signature=${signature}`;
}
