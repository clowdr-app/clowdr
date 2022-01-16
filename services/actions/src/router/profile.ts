import { gql } from "@apollo/client/core";
import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { checkJwt } from "@midspace/auth/middlewares/checkJwt";
import { parseSessionVariables } from "@midspace/auth/middlewares/parse-session-variables";
import type { ActionPayload } from "@midspace/hasura/action";
import type { updateProfilePhotoArgs, UpdateProfilePhotoResponse } from "@midspace/hasura/actionTypes";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { json } from "body-parser";
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import pMemoize from "p-memoize";
import { assertType, TypeGuardError } from "typescript-is";
import type { Maybe } from "../generated/graphql";
import { UpdateProfilePhotoDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { awsClient, getAWSParameter, ImagesSecretsManager, S3 } from "../lib/aws/awsClient";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret(awsClient));
router.use(json());
router.use(checkJwt(awsClient));

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
`;

async function checkS3Url(
    url: string
): Promise<{ result: "success"; key: string } | { result: "error"; message: string }> {
    const { region, bucket, key } = AmazonS3URI(url);
    if (region !== awsClient.region) {
        return { result: "error", message: "Invalid S3 URL (region mismatch)" };
    }
    if (bucket !== (await getAWSParameter("CONTENT_BUCKET_ID"))) {
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
    const response = await (
        await ImagesSecretsManager()
    ).getSecretValue({
        SecretId: await getAWSParameter("IMAGES_SECRET_ARN"),
    });

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
        await (
            await apolloClient
        ).mutate({
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

        const secret = await getImagesSecretValueMemoized();
        photoURL_350x350 = generateSignedImageURL(
            await getAWSParameter("IMAGES_CLOUDFRONT_DOMAIN_NAME"),
            secret,
            await getAWSParameter("CONTENT_BUCKET_ID"),
            validatedS3URL.key,
            350,
            350
        );
        photoURL_50x50 = generateSignedImageURL(
            await getAWSParameter("IMAGES_CLOUDFRONT_DOMAIN_NAME"),
            secret,
            await getAWSParameter("CONTENT_BUCKET_ID"),
            validatedS3URL.key,
            50,
            50
        );

        await (
            await apolloClient
        ).mutate({
            mutation: UpdateProfilePhotoDocument,
            variables: {
                registrantId,
                userId,
                bucket: await getAWSParameter("CONTENT_BUCKET_ID"),
                objectName: validatedS3URL.key,
                region: awsClient.region,
                photoURL_350x350,
                photoURL_50x50,
            },
        });
    }

    return {
        ok: true,
        photoURL_350x350,
        photoURL_50x50,
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

function btoa(str: string) {
    return Buffer.from(str, "binary").toString("base64");
}

function generateSignedImageURL(
    cloudFrontDomainName: string,
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
    return `https://${cloudFrontDomainName}${path}?signature=${signature}`;
}
