import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import path from "path";
import { Auth0ClientResource } from "../custom-resources/auth0/auth0Client";
import { Auth0CustomDomainResource } from "../custom-resources/auth0/auth0CustomDomain";
import { Auth0DatabaseConnectionResource } from "../custom-resources/auth0/auth0DatabaseConnection";
import { Auth0EmailProviderResource } from "../custom-resources/auth0/auth0EmailProvider";
import { Auth0EmailTemplatesResource } from "../custom-resources/auth0/auth0EmailTemplates";
import { Auth0PageTemplatesResource } from "../custom-resources/auth0/auth0PageTemplates";
import { Auth0ResourceServerResource } from "../custom-resources/auth0/auth0ResourceServer";
import { Auth0RuleParameterResource } from "../custom-resources/auth0/auth0RuleParameter";
import { Auth0RuleTemplatesResource } from "../custom-resources/auth0/auth0RuleTemplates";
import { Auth0TenantResource } from "../custom-resources/auth0/auth0Tenant";
import type { Env } from "../env";

export interface Auth0StackProps extends cdk.StackProps {
    stackPrefix: string;
    vars: Env;

    FrontendHosts: string[];
    CustomDomain?: string;

    SendGridAPISecret?: sm.ISecret;

    HasuraAdminSecret: sm.ISecret;
    GraphQLEndpointURL: string;
}

export class Auth0Stack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: Auth0StackProps) {
        super(scope, id, props);

        const auth0Credentials = sm.Secret.fromSecretNameV2(this, "CredentialsSecret", "Auth0ManagementAPICredentials");

        const Auth0APIDomain = auth0Credentials.secretValueFromJson("Domain").toString();
        const Auth0Audience = "hasura";
        const Auth0IssuerDomain = `https://${Auth0APIDomain}`;

        new ssm.StringParameter(this, "DomainParameter", {
            parameterName: "AUTH0_API_DOMAIN",
            allowedPattern: ".*",
            stringValue: Auth0APIDomain,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "AudienceParameter", {
            parameterName: "AUTH0_AUDIENCE",
            allowedPattern: ".*",
            stringValue: Auth0Audience,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "IssuerDomainParameter", {
            parameterName: "AUTH0_ISSUER_DOMAIN",
            allowedPattern: ".*",
            stringValue: Auth0IssuerDomain,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });

        new Auth0TenantResource(this, "Auth0Tenant", {
            ManagementAPICredentials: auth0Credentials,

            Name: props.vars.AUTH0_LOGIN_TITLE,
            EnabledLocales: props.vars.AUTH0_LOGIN_ENABLED_LOCALES,
            PictureURL: props.vars.AUTH0_PICTURE_URL,
            SupportEmail: props.vars.AUTH0_SUPPORT_EMAIL,
            SupportURL: props.vars.AUTH0_SUPPORT_URL,
            UniversalLoginTheme: {
                colors: {
                    page_background: "#2D0045",
                    primary: "#B9095B",
                },
            },
            EnableCustomDomain: props.vars.AUTH0_ENABLE_CUSTOM_DOMAIN,
        });

        if (props.CustomDomain) {
            new Auth0CustomDomainResource(this, "Auth0CustomDomain", {
                ManagementAPICredentials: auth0Credentials,

                Domain: props.CustomDomain,
            });
        }
        // TODO: Auth0 Custom Domain - Separate script to trigger verification

        if (props.SendGridAPISecret) {
            new Auth0EmailProviderResource(this, "Auth0EmailProvider", {
                ManagementAPICredentials: auth0Credentials,

                DefaultFromAddress: props.vars.AUTH0_SENDER_EMAIL,
                SendGridAPISecret: props.SendGridAPISecret,
            });
        }

        // TODO: Make this more generic so it can be re-used for other clients (e.g. FreshStatus, Pheedloop Bot)
        const midspaceAPIClient = new Auth0ClientResource(this, "Auth0Client", {
            ManagementAPICredentials: auth0Credentials,

            Name: "Midspace",
            FrontendHosts: props.FrontendHosts,
        });
        // TODO: FreshStatus custom login client?

        new Auth0ResourceServerResource(this, "Auth0ResourceServer", {
            ManagementAPICredentials: auth0Credentials,

            Name: "Midspace API",
        });

        new Auth0DatabaseConnectionResource(this, "Auth0DatabaseConnection", {
            ManagementAPICredentials: auth0Credentials,

            Name: "Username-Password-Authentication",
            EnabledClients: [midspaceAPIClient.auth0ClientId],
        });

        const templatesBucket = new s3.Bucket(this, "Auth0Templates", {
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        new s3deploy.BucketDeployment(this, "DeployAuth0Templates", {
            sources: [s3deploy.Source.asset(path.join(__dirname, "../custom-resources/auth0/templates"))],
            destinationBucket: templatesBucket,
        });

        new Auth0EmailTemplatesResource(this, "Auth0EmailTemplates", {
            ManagementAPICredentials: auth0Credentials,

            TemplatesS3Bucket: templatesBucket,
            SenderEmail: props.vars.AUTH0_SENDER_EMAIL,
            SenderName: props.vars.AUTH0_SENDER_NAME,
        });

        // TODO: Even though this is applied, the changes don't seem to appear
        //       in the Auth0 settings. So either the Tenant resource is
        //       overwriting the changes or something else is going wrong.
        new Auth0PageTemplatesResource(this, "Auth0PageTemplates", {
            ManagementAPICredentials: auth0Credentials,

            TemplatesS3Bucket: templatesBucket,
            Auth0ClientId: midspaceAPIClient.auth0ClientId,
        });

        new Auth0RuleTemplatesResource(this, "Auth0RuleTemplates", {
            ManagementAPICredentials: auth0Credentials,

            TemplatesS3Bucket: templatesBucket,
        });
        new Auth0RuleParameterResource(this, "HasuraAdminSecret", {
            ManagementAPICredentials: auth0Credentials,
            Key: "HASURA_ADMIN_SECRET",
            Value: props.HasuraAdminSecret,
        });
        new Auth0RuleParameterResource(this, "GraphQLEndpoint", {
            ManagementAPICredentials: auth0Credentials,
            Key: "HASURA_URL",
            Value: props.GraphQLEndpointURL,
        });
    }
}
