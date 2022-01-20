import * as sm from "@aws-cdk/aws-secretsmanager";
import * as cdk from "@aws-cdk/core";
import { SendGridAPIKeyResource } from "../custom-resources/sendgrid/sendgridAPIKey";
import { SendGridWebhooksResource } from "../custom-resources/sendgrid/sendgridWebhooks";
import type { Env } from "../env";

export interface SendGridStackProps extends cdk.StackProps {
    stackPrefix: string;
    vars: Env;

    ActionsServiceEndpoint: string;
}

export class SendGridStack extends cdk.Stack {
    public readonly auth0SendGridAPICredentials: sm.ISecret;
    public readonly actionsSendGridAPICredentials: sm.ISecret;

    constructor(scope: cdk.Construct, id: string, props: SendGridStackProps) {
        super(scope, id, props);

        const sendgridCredentials = sm.Secret.fromSecretNameV2(
            this,
            "CredentialsSecret",
            "SendGridAccountAPICredentials"
        );

        this.auth0SendGridAPICredentials = new sm.Secret(this, "Auth0SendGridAPICredentials", {
            secretName: "Auth0SendGridAPICredentials",
            secretStringBeta1: sm.SecretStringValueBeta1.fromUnsafePlaintext("Uninitialized"),
        });

        this.actionsSendGridAPICredentials = new sm.Secret(this, "ActionsSendGridAPICredentials", {
            secretName: "ActionsSendGridAPICredentials",
            secretStringBeta1: sm.SecretStringValueBeta1.fromUnsafePlaintext("Uninitialized"),
        });

        new SendGridAPIKeyResource(this, "Auth0APIKey", {
            AccountAPICredentials: sendgridCredentials,
            NewAPIKeyCredentials: this.auth0SendGridAPICredentials,
            Name: "Auth0 - Auto-Deployment",
        });
        new SendGridAPIKeyResource(this, "ActionsServiceAPIKey", {
            AccountAPICredentials: sendgridCredentials,
            NewAPIKeyCredentials: this.actionsSendGridAPICredentials,
            Name: "Actions Service - Auto-Deployment",
        });

        new SendGridWebhooksResource(this, "Webhooks", {
            AccountAPICredentials: sendgridCredentials,
            URL: props.ActionsServiceEndpoint,
        });
    }
}
