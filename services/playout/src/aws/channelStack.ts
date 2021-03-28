import * as medialive from "@aws-cdk/aws-medialive";
import * as cdk from "@aws-cdk/core";

export interface ChannelStackProps extends cdk.StackProps {
    inputSecurityGroupId: string;
    roomId: string;
    awsPrefix: string;
    generateId(): string;
}

export class ChannelStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: ChannelStackProps) {
        super(scope, id, props);

        const rtmpInputA = new medialive.CfnInput(this, "rtmpInputA", {
            destinations: [
                {
                    streamName: "rtmpInputA",
                },
            ],
            tags: {
                roomId: props.roomId,
                environment: props.awsPrefix ?? "unknown",
            },
            name: props.generateId(),
            type: "RTMP_PUSH",
            inputSecurityGroups: [props.inputSecurityGroupId],
        });

        new cdk.CfnOutput(this, "RtmpInputA", {
            value: rtmpInputA.ref,
        });
    }
}
