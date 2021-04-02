import { CloudFormation, StackStatus } from "@aws-sdk/client-cloudformation";
import { Credentials as NewSdkCredentials } from "@aws-sdk/types";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Bunyan from "bunyan";
import * as R from "ramda";
import { AWS_MODULE_OPTIONS } from "../../constants";
import { AwsModuleOptions } from "../aws.module";

@Injectable()
export class CloudFormationService {
    private readonly logger: Bunyan;

    private readonly credentials: NewSdkCredentials;
    private readonly region: string;
    private _cloudFormation: CloudFormation;

    get cloudFormation(): CloudFormation {
        return this._cloudFormation;
    }

    constructor(
        @RootLogger() logger: Bunyan,
        @Inject(AWS_MODULE_OPTIONS) config: AwsModuleOptions,
        private configService: ConfigService
    ) {
        this.logger = logger.child({ component: this.constructor.name });

        this.credentials = config.credentials;
        this.region = config.region;
    }

    onModuleInit(): void {
        this._cloudFormation = new CloudFormation({
            apiVersion: "2010-05-15",
            credentials: this.credentials,
            region: this.region,
        });
    }

    public parseCloudFormationEvent(message: string): { [key: string]: string } {
        const rawPairs = message.replace(/\r/g, "").split(/\n/);
        const pairs = rawPairs.map<[key: string, value: string]>((pair) => {
            const idxEquals = pair.indexOf("=");
            const key = pair.substring(0, idxEquals);
            const value = pair.slice(idxEquals + 2, -1);
            return [key, value];
        });
        return R.fromPairs(pairs);
    }

    public async getStackStatus(
        stackLogicalResourceId: string
    ): Promise<{ stackStatus: StackStatus | string; arn: string } | null> {
        const stacks = await this.cloudFormation.describeStacks({
            StackName: stackLogicalResourceId,
        });

        if (!stacks.Stacks || stacks.Stacks.length !== 1) {
            return null;
        }

        const stack = stacks.Stacks[0];

        if (!stack.StackId || !stack.StackStatus) {
            return null;
        }

        return { stackStatus: stack.StackStatus, arn: stack.StackId };
    }
}
