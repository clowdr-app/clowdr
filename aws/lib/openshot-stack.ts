import * as ec2 from "@aws-cdk/aws-ec2";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as iam from "@aws-cdk/aws-iam";
import * as sqs from "@aws-cdk/aws-sqs";
import * as cdk from "@aws-cdk/core";

export class OpenshotStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /* OpenShot cloud API */
        const openShotServiceUser = new iam.User(
            this,
            "OpenShotServiceUser",
            {}
        );
        openShotServiceUser.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
        );
        openShotServiceUser.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSQSFullAccess")
        );

        const openShotAccessKey = new iam.CfnAccessKey(
            this,
            "OpenShotAccessKey",
            {
                userName: openShotServiceUser.userName,
            }
        );

        const vpc = new ec2.Vpc(this, "VPC", {
            cidr: "10.1.0.0/16",
            subnetConfiguration: [
                {
                    name: "public",
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    name: "private",
                    subnetType: ec2.SubnetType.PRIVATE,
                },
            ],
        });

        const openShotLoadBalancer = new elbv2.ApplicationLoadBalancer(
            this,
            "OpenShotLoadBalancer",
            {
                vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: ec2.SubnetType.PUBLIC,
                }),
                internetFacing: true,
            }
        );

        const openShotAmi = new ec2.LookupMachineImage({
            name:
                "OpenShot Cloud API (1.2.3)-82b57f78-74b8-415f-9bff-1705102d8557-ami-0bcc970b7833289ec.4",
        });

        const openShotInstance = new ec2.Instance(this, "OpenShotInstance", {
            machineImage: openShotAmi,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T2,
                ec2.InstanceSize.MEDIUM
            ),
            keyName: this.node.tryGetContext("clowdr/openShotKeyPairName"),
            vpc: vpc,
            allowAllOutbound: true,
            vpcSubnets: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE,
            }),
        });

        openShotInstance.connections.allowFrom(
            openShotLoadBalancer,
            ec2.Port.tcp(80)
        );
        openShotInstance.connections.allowFrom(
            openShotLoadBalancer,
            ec2.Port.tcp(22)
        );

        const openShotQueue = new sqs.Queue(this, "OpenShotAPIExportQueue", {});
        openShotQueue.grantConsumeMessages(openShotServiceUser);
        openShotQueue.grantPurge(openShotServiceUser);
        openShotQueue.grantSendMessages(openShotServiceUser);

        // const httpsListener = openShotLoadBalancer.addListener(
        //     "OpenShotHttpsListener",
        //     {
        //         port: 443,
        //         open: true,
        //     }
        // );

        // httpsListener.addTargets("OpenShotAPIHttpTarget", {
        //     port: 80,
        //     targets: [new elbv2_targets.InstanceTarget(openShotInstance)],
        // });

        // const sshListener = openShotLoadBalancer.addListener(
        //     "OpenShotSshListener",
        //     {
        //         port: 22,
        //         open: true,
        //     }
        // );

        // sshListener.addTargets("OpenShotAPISshTarget", {
        //     port: 22,
        //     targets: [new elbv2_targets.InstanceTarget(openShotInstance)],
        // });

        // Openshot
        new cdk.CfnOutput(this, "OpenShotAccessKeyId", {
            value: openShotAccessKey.ref,
        });

        new cdk.CfnOutput(this, "OpenShotSecretAccessKey", {
            value: openShotAccessKey.attrSecretAccessKey,
        });

        new cdk.CfnOutput(this, "OpenShotLoadBalancerDnsName", {
            value: openShotLoadBalancer.loadBalancerDnsName,
        });

        new cdk.CfnOutput(this, "OpenShotAPIExportQueueName", {
            value: openShotQueue.queueName,
        });
    }
}
