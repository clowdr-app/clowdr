import { gql } from "@apollo/client/core";
import assert from "assert";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { AuthenticatedRequest } from "../checkScopes";
import { GetOtherAttendeeProfileDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { checkEventSecret } from "../middlewares/checkEventSecret";
import { checkJwt } from "../middlewares/checkJwt";
import { checkUserScopes } from "../middlewares/checkScopes";
import crypto from "crypto";

export const router = express.Router();

// Protected routes
router.use(checkEventSecret);
router.use(bodyParser.json());
router.use(checkJwt);
router.use(checkUserScopes);

assert(process.env.AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME, "AWS_IMAGES_CLOUDFRONT_DISTRIBUTION_NAME not provided.");
assert(process.env.AWS_IMAGES_SECRET_VALUE, "AWS_IMAGES_SECRET_VALUE not provided.");

// TODO: How do we avoid having the permissions check in GQL code here???
gql`
    query GetOtherAttendeeProfile($attendeeId: uuid!, $callerId: String!) {
        Attendee(
            where: {
                _and: {
                    id: { _eq: $attendeeId }
                    conference: {
                        groups: {
                            _and: {
                                enabled: { _eq: true }
                                _and: {
                                    _or: [
                                        { groupAttendees: { attendee: { userId: { _eq: $callerId } } } }
                                        { includeUnauthenticated: { _eq: true } }
                                    ]
                                    groupRoles: {
                                        role: {
                                            rolePermissions: {
                                                permissionName: {
                                                    _in: [
                                                        CONFERENCE_VIEW_ATTENDEES
                                                        CONFERENCE_MANAGE_ATTENDEES
                                                        CONFERENCE_MANAGE_GROUPS
                                                        CONFERENCE_MANAGE_ROLES
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ) {
            profile {
                photoS3BucketName
                photoS3ObjectName
                photoS3BucketRegion
            }
        }
    }
`;

function btoa(str: string) {
    return Buffer.from(str, "binary").toString("base64");
}

async function handleGetProfileURL(callerUserId: string, args: getProfilePhotoUrlArgs): Promise<string> {
    const profile = await apolloClient.query({
        query: GetOtherAttendeeProfileDocument,
        variables: {
            attendeeId: args.attendeeId,
            callerId: callerUserId,
        },
    });

    assert(profile.data.Attendee[0].profile, "Profile not found");
    assert(profile.data.Attendee[0].profile.photoS3BucketName, "No photo");
    assert(profile.data.Attendee[0].profile.photoS3BucketRegion, "No photo");
    assert(profile.data.Attendee[0].profile.photoS3ObjectName, "No photo");

    const imageRequest = JSON.stringify({
        bucket: profile.data.Attendee[0].profile.photoS3BucketName,
        key: profile.data.Attendee[0].profile.photoS3ObjectName,
        edits: {
            resize: {
                width: args.w,
                height: args.h,
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

router.post("/photoURL", async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedRequest;

    try {
        assertType<getProfilePhotoUrlArgs>(req.body.input);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }

    let url = "<NONE>";

    try {
        url = await handleGetProfileURL(req.userId, req.body.input);
    } catch (e) {
        res.status(500).json("Could not get profile URL");
        return;
    }

    const result: ProfilePhotoURLResponse = {
        url,
    };
    return res.status(200).json(result);
});
