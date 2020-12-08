import { gql } from "@apollo/client/core";
import { Output } from "@aws-sdk/client-cloudformation";
import assert from "assert";
import fs from "fs/promises";
import pRetry, { AbortError } from "p-retry";
import path from "path";
import slugify from "slugify";
import { CloudFormation, IAM, shortId } from "../aws/awsClient";
import { SetConferenceConfigurationDocument } from "../generated/graphql";
import { client } from "../graphqlClient";
import { ConferenceData, Payload } from "../types/event";

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

    console.log(`Creating S3 bucket for new conference ${conferenceName}`);

    const slug = `${shortId()}-${slugify(conferenceName, {
        lower: true,
        strict: true,
        locale: "en",
    }).substring(0, 7)}`;

    const template = await fs.readFile(
        path.join(__dirname, "..", "resources", "S3Bucket.yaml")
    );

    if (!template) {
        throw new Error("Could not load S3Bucket.yaml");
    }

    const currentUser = await IAM.getUser({});
    if (!currentUser.User) {
        throw new Error("Could not determine current user");
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
        throw new Error("Could not create CloudFormation stack");
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
        console.log(`Checking status of stack ${stackCreation.StackId}`);
        const status = await CloudFormation.describeStacks({
            StackName: stackCreation.StackId,
        });

        if (!status.Stacks || status.Stacks.length < 1) {
            throw new Error("No stacks found");
        }

        if (status.Stacks[0].StackStatus === "CREATE_COMPLETE") {
            if (!status.Stacks[0].Outputs) {
                throw new AbortError("Stack does not have any outputs");
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

        throw new Error("Stack not complete yet");
    };

    const bucket = pRetry(checkStackStatus, {
        retries: 5,
        minTimeout: 10000,
    })
        .then(async (outputs) => {
            console.log("Created bucket");

            const bucketId = outputs.find((o) => o.OutputKey === "Bucket")
                ?.OutputValue;

            assert(bucketId, "No bucket ID returned from stack");

            await client.mutate({
                mutation: SetConferenceConfigurationDocument,
                variables: {
                    conferenceId: conferenceId,
                    key: "S3_BUCKET",
                    value: {
                        stackId: stackCreation.StackId,
                        stackStatus: "CREATE_COMPLETE",
                        s3BucketId: bucketId,
                    },
                },
            });

            console.log("Recorded bucket ID");
        })
        .catch((e) => {
            console.error(`Failed to create bucket '${bucket}'`, e);
        });
}
