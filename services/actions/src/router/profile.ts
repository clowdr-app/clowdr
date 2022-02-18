import { gql } from "@apollo/client/core";
import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { checkJwt } from "@midspace/auth/middlewares/checkJwt";
import { parseSessionVariables } from "@midspace/auth/middlewares/parse-session-variables";
import type { ActionPayload } from "@midspace/hasura/action";
import type { updateProfilePhotoArgs, UpdateProfilePhotoResponse } from "@midspace/hasura/action-types";
import assert from "assert";
import { json } from "body-parser";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { assertType, TypeGuardError } from "typescript-is";
import { UpdateProfilePhotoDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { generateSignedImageURL } from "../lib/aws/cloudFront";
import { checkS3Url } from "../lib/aws/s3";
import { getImagesSecretValue } from "../lib/aws/secretsManager";
import { BadRequestError, UnexpectedServerError } from "../lib/errors";

export const router = express.Router();

router.use(checkEventSecret);
router.use(json());
router.use(checkJwt);

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

async function handleUpdateProfilePhoto(
    userId: string,
    { registrantId, s3URL }: updateProfilePhotoArgs
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

        assert(
            process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME,
            "AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME not provided."
        );

        const secret = await getImagesSecretValue();
        photoURL_350x350 = generateSignedImageURL(
            process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME,
            secret,
            process.env.AWS_CONTENT_BUCKET_ID,
            validatedS3URL.key,
            350,
            350
        );
        photoURL_50x50 = generateSignedImageURL(
            process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME,
            secret,
            process.env.AWS_CONTENT_BUCKET_ID,
            validatedS3URL.key,
            50,
            50
        );

        await apolloClient.mutate({
            mutation: UpdateProfilePhotoDocument,
            variables: {
                registrantId,
                userId,
                bucket: process.env.AWS_CONTENT_BUCKET_ID,
                objectName: validatedS3URL.key,
                region: process.env.AWS_REGION,
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
            const result = await handleUpdateProfilePhoto(req.userId, body.input);
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
