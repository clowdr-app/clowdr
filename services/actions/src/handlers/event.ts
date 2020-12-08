import { gql } from "@apollo/client/core";
import sgMail from "@sendgrid/mail";
import assert from "assert";
import fs from "fs/promises";
import pRetry, { AbortError } from "p-retry";
import path from "path";
import slugify from "slugify";
import { CloudFormation, IAM, shortId } from "../aws/awsClient";
import { apolloClient } from "../graphqlClient";
import { ConferenceData, EmailData, Payload } from "../types/event";

gql`
    query GetConferenceConfiguration($conferenceId: uuid!, $key: String!) {
        ConferenceConfiguration(
            where: { conferenceId: { _eq: $conferenceId }, key: { _eq: $key } }
        ) {
            value
        }
    }

    mutation SetConferenceConfiguration(
        $conferenceId: uuid!
        $key: String!
        $value: jsonb!
    ) {
        insert_ConferenceConfiguration_one(
            object: { conferenceId: $conferenceId, key: $key, value: $value }
            on_conflict: {
                constraint: ConferenceConfiguration_conferenceId_key_key
                update_columns: value
            }
        ) {
            id
        }
    }
`;

export async function handleConferenceCreated(
    payload: Payload<ConferenceData>
): Promise<void> {
    if (!payload.event.data.new) {
        throw new Error("No new conference data");
    }

    const conferenceName = payload.event.data.new.name;
    const conferenceId = payload.event.data.new.id;

    console.log(`ConferenceCreated ${conferenceId}: creating S3 bucket`);

    const slug = `${shortId()}-${slugify(conferenceName, {
        lower: true,
        strict: true,
        locale: "en",
    }).substring(0, 7)}`;

    const template = await fs.readFile(
        path.join(__dirname, "..", "resources", "S3Bucket.yaml")
    );

    if (!template) {
        throw new Error(
            `ConferenceCreated ${conferenceId}: could not load S3Bucket.yaml`
        );
    }

    const currentUser = await IAM.getUser({});
    if (!currentUser.User) {
        throw new Error(
            `ConferenceCreated ${conferenceId}: could not determine current AWS user`
        );
    }

    const userArn = currentUser.User?.Arn;

    const stackCreation = await CloudFormation.createStack({
        StackName: `bucket-${slug}`,
        Capabilities: ["CAPABILITY_IAM"],
        Parameters: [
            { ParameterKey: "ConferenceName", ParameterValue: conferenceName },
            {
                ParameterKey: "ConferenceId",
                ParameterValue: payload.event.data.new.id,
            },
            { ParameterKey: "UserArn", ParameterValue: userArn },
        ],
        TemplateBody: template.toString(),
    });

    if (!stackCreation.StackId) {
        throw new Error(
            `ConferenceCreated ${conferenceId}: could not create CloudFormation stack`
        );
    }

    await client.mutate({
        mutation: SetConferenceConfigurationDocument,
        variables: {
            conferenceId: conferenceId,
            key: "S3_BUCKET",
            value: {
                stackId: stackCreation.StackId,
                stackStatus: "CREATE_IN_PROGRESS",
            },
        },
    });

    const checkStackStatus = async (): Promise<Output[]> => {
        console.log(
            `ConferenceCreated ${conferenceId}: checking status of stack ${stackCreation.StackId}`
        );
        const status = await CloudFormation.describeStacks({
            StackName: stackCreation.StackId,
        });

        if (!status.Stacks || status.Stacks.length < 1) {
            throw new Error(
                `ConferenceCreated ${conferenceId}: no stacks found`
            );
        }

        if (status.Stacks[0].StackStatus === "CREATE_COMPLETE") {
            if (!status.Stacks[0].Outputs) {
                throw new AbortError(
                    `ConferenceCreated ${conferenceId}: stack does not have any outputs`
                );
            }
            return status.Stacks[0].Outputs;
        }

        await client.mutate({
            mutation: SetConferenceConfigurationDocument,
            variables: {
                conferenceId: conferenceId,
                key: "S3_BUCKET",
                value: {
                    stackId: stackCreation.StackId,
                    stackStatus: status.Stacks[0].StackStatus,
                },
            },
        });

        throw new Error(
            `ConferenceCreated ${conferenceId}: stack not complete yet`
        );
    };

    const bucket = pRetry(checkStackStatus, {
        retries: 5,
        minTimeout: 10000,
    })
        .then(async (outputs) => {
            console.log(
                `ConferenceCreated ${conferenceId}: stack creation finished`
            );

            const bucketId = outputs.find((o) => o.OutputKey === "Bucket")
                ?.OutputValue;

            assert(
                bucketId,
                `ConferenceCreated ${conferenceId}: no bucket ID returned from stack`
            );

            const bucketRole = outputs.find(
                (o) => o.OutputKey === "BucketAdminRole"
            )?.OutputValue;

            assert(
                bucketRole,
                `ConferenceCreated ${conferenceId}: no bucket role returned from stack`
            );

            const config = {
                stackId: stackCreation.StackId,
                stackStatus: "CREATE_COMPLETE",
                s3BucketId: bucketId,
                s3BucketRoleId: bucketRole,
            };

            await client.mutate({
                mutation: SetConferenceConfigurationDocument,
                variables: {
                    conferenceId: conferenceId,
                    key: "S3_BUCKET",
                    value: config,
                },
            });

            console.log(
                `ConferenceCreated ${conferenceId}: updated config`,
                config
            );
        })
        .catch((e) => {
            console.error(
                `ConferenceCreated ${conferenceId}: failed to create bucket '${bucket}'`,
                e
            );
        });
}

export async function handleEmailCreated(
    payload: Payload<EmailData>
): Promise<void> {
    if (!payload.event.data.new) {
        throw new Error("No new email data");
    }

    const email = payload.event.data.new;

    if (email.sentAt === null && email.retriesCount < 3) {
        assert(process.env.SENDGRID_SENDER);

        const msg = {
            to: email.emailAddress,
            from: process.env.SENDGRID_SENDER,
            subject: email.subject,
            text: email.plainTextContents,
            html: email.htmlContents,
        };

        let error;
        try {
            await sgMail.send(msg);
        } catch (e) {
            error = e;
        }

        await apolloClient.mutate({
            mutation: gql`
                mutation UpdateEmail($id: uuid!, $sentAt: timestamptz = null) {
                    update_Email(
                        where: { id: { _eq: $id } }
                        _set: { sentAt: $sentAt }
                        _inc: { retriesCount: 1 }
                    ) {
                        affected_rows
                    }
                }
            `,
            variables: {
                id: email.id,
                sentAt: error ? null : new Date().toISOString(),
            },
        });

        if (error) {
            throw error;
        }
    }
}
