import { gql } from "@apollo/client/core";
import sgMail from "@sendgrid/mail";
import assert from "assert";
import fs from "fs/promises";
import pRetry from "p-retry";
import path from "path";
import slugify from "slugify";
import { CloudFormation, IAM, shortId } from "../aws/awsClient";
import { apolloClient } from "../graphqlClient";
import { ConferenceData, EmailData, Payload } from "../types/event";

export async function handleConferenceCreated(
    payload: Payload<ConferenceData>
): Promise<void> {
    if (!payload.event.data.new) {
        throw new Error("No new conference data");
    }

    const conferenceName = payload.event.data.new.name;

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

    const checkStackStatus = async () => {
        console.log(`Checking status of stack ${stackCreation.StackId}`);
        const status = await CloudFormation.describeStacks({
            StackName: stackCreation.StackId,
        });

        if (!status.Stacks || status.Stacks.length < 1) {
            throw new Error("No stacks found");
        }

        if (status.Stacks[0].StackStatus === "CREATE_COMPLETE") {
            const bucket = status.Stacks[0].Outputs?.find(
                (output) => output.OutputKey === "Bucket"
            );
            if (!bucket || !bucket.OutputValue) {
                throw new pRetry.AbortError(
                    "Could not find expect output 'Bucket'"
                );
            }
            return bucket.OutputValue;
        }

        throw new Error("Stack not complete yet");
    };

    const bucket = await pRetry(checkStackStatus, {
        retries: 5,
        minTimeout: 10000,
    });

    console.log(`Created bucket '${bucket}'`);
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
