import { gql } from "@apollo/client/core";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import bodyParser from "body-parser";
import crypto from "crypto";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { UpdateProfilePhotoDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3 } from "../lib/aws/awsClient";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { checkJwt } from "../middlewares/checkJwt";
import { checkUserScopes } from "../middlewares/checkScopes";

assert(process.env.AWS_ACTIONS_USER_ACCESS_KEY_ID, "AWS_ACTIONS_USER_ACCESS_KEY_ID environment variable not provided.");
assert(
    process.env.AWS_ACTIONS_USER_SECRET_ACCESS_KEY,
    "AWS_ACTIONS_USER_SECRET_ACCESS_KEY environment variable not provided."
);
assert(process.env.AWS_REGION, "AWS_REGION environment variable not provided.");

assert(process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME, "AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME not provided.");
assert(process.env.AWS_IMAGES_SECRET_VALUE, "AWS_IMAGES_SECRET_VALUE not provided.");

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(bodyParser.json());
router.use(checkJwt);
router.use(checkUserScopes);

gql`
    mutation UpdateProfilePhoto(
        $attendeeId: uuid!
        $userId: String!
        $objectName: String = null
        $bucket: String = null
        $region: String = null
        $photoURL_50x50: String = null
        $photoURL_350x350: String = null
    ) {
        update_AttendeeProfile(
            where: {
                _and: [
                    { attendeeId: { _eq: $attendeeId } }
                    {
                        attendee: {
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
    } catch (e) {
        return {
            result: "error",
            message: "Could not retrieve object from S3",
        };
    }

    return { result: "success", key };
}

async function handleUpdateProfilePhoto(
    userId: string,
    attendeeId: string,
    s3URL: Maybe<string> | undefined
): Promise<UpdateProfilePhotoResponse> {
    let photoURL_350x350: string | undefined;
    let photoURL_50x50: string | undefined;
    if (!s3URL || s3URL.length === 0) {
        await apolloClient.mutate({
            mutation: UpdateProfilePhotoDocument,
            variables: {
                attendeeId,
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

        photoURL_350x350 = generateSignedImageURL(process.env.AWS_CONTENT_BUCKET_ID, validatedS3URL.key, 350, 350);
        photoURL_50x50 = generateSignedImageURL(process.env.AWS_CONTENT_BUCKET_ID, validatedS3URL.key, 50, 50);

        await apolloClient.mutate({
            mutation: UpdateProfilePhotoDocument,
            variables: {
                attendeeId,
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

router.post("/photo/update", async (req: Request, res: Response) => {
    const params: updateProfilePhotoArgs = req.body.input;
    try {
        assertType<updateProfilePhotoArgs>(params);
    } catch (e) {
        console.error(`${req.originalUrl}: invalid request`, params);
        return res.status(200).json({
            ok: false,
        });
    }

    try {
        console.log(`${req.originalUrl}: profile photo upload requested`);
        const userId = req.body.session_variables["x-hasura-user-id"];
        const result = await handleUpdateProfilePhoto(userId, params.attendeeId, params.s3URL);
        return res.status(200).json(result);
    } catch (e) {
        console.error(`${req.originalUrl}: profile photo upload failed`);
        return res.status(200).json({
            ok: false,
        });
    }
});

function btoa(str: string) {
    return Buffer.from(str, "binary").toString("base64");
}

function generateSignedImageURL(bucketName: string, objectName: string, width: number, height: number): string {
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
    const secret = process.env.AWS_IMAGES_SECRET_VALUE;
    assert(secret);
    const signature = crypto.createHmac("sha256", secret).update(path).digest("hex");
    return `https://${process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME}.cloudfront.net${path}?signature=${signature}`;
}
