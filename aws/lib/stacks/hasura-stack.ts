import * as sm from "@aws-cdk/aws-secretsmanager";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import type { Env } from "../env";

export interface HasuraStackProps extends cdk.StackProps {
    stackPrefix: string;
    vars: Env;
}

export class HasuraStack extends cdk.Stack {
    public readonly adminSecret: sm.Secret;
    public readonly endpointURL: string;

    constructor(scope: cdk.Construct, id: string, props: HasuraStackProps) {
        super(scope, id, props);

        this.adminSecret = new sm.Secret(this, "HASURA_ADMIN_SECRET", {
            secretName: "HASURA_ADMIN_SECRET",
            description: "Secret for Hasura Admin calls",
            generateSecretString: {
                secretStringTemplate: "{}",
                generateStringKey: "secret",
            },
        });

        this.endpointURL = `${props.vars.GRAPHQL_API_SECURE_PROTOCOLS ? "https" : "http"}://${
            props.vars.GRAPHQL_API_DOMAIN
        }/v1/graphql`;

        new ssm.StringParameter(this, "/EnvVars/GRAPHQL_API_SECURE_PROTOCOLS", {
            allowedPattern: ".*",
            parameterName: "GRAPHQL_API_SECURE_PROTOCOLS",
            stringValue: props.vars.GRAPHQL_API_SECURE_PROTOCOLS,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/GRAPHQL_API_DOMAIN", {
            allowedPattern: ".*",
            parameterName: "GRAPHQL_API_DOMAIN",
            stringValue: props.vars.GRAPHQL_API_DOMAIN,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
        new ssm.StringParameter(this, "/EnvVars/GRAPHQL_ENDPOINT", {
            allowedPattern: ".*",
            parameterName: "GRAPHQL_ENDPOINT",
            stringValue: this.endpointURL,
            tier: ssm.ParameterTier.INTELLIGENT_TIERING,
        });
    }
}
