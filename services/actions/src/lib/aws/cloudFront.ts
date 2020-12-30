import { CloudFront, shortId } from "../../aws/awsClient";
import { OriginEndpoint } from "./mediaPackage";

export interface Distribution {
    id: string;
    domain: string;
}

export async function createDistribution(roomId: string, originEndpoint: OriginEndpoint): Promise<Distribution> {
    const originEndpointDomain = new URL(originEndpoint.endpointUri).hostname;

    const originId = shortId();
    const distribution = await CloudFront.createDistribution({
        DistributionConfig: {
            Origins: {
                Items: [
                    {
                        Id: originId,
                        DomainName: originEndpointDomain,
                        CustomOriginConfig: {
                            HTTPPort: 80,
                            HTTPSPort: 443,
                            OriginProtocolPolicy: "match-viewer",
                            OriginSslProtocols: {
                                Quantity: 3,
                                Items: ["TLSv1", "TLSv1.1", "TLSv1.2"],
                            },
                            OriginReadTimeout: 30,
                            OriginKeepaliveTimeout: 5,
                        },
                        ConnectionAttempts: 3,
                        ConnectionTimeout: 10,
                        OriginShield: {
                            Enabled: false,
                        },
                    },
                ],
                Quantity: 1,
            },
            DefaultCacheBehavior: {
                TargetOriginId: originId,
                TrustedSigners: {
                    Enabled: false,
                    Quantity: 0,
                },
                TrustedKeyGroups: {
                    Enabled: false,
                    Quantity: 0,
                },
                ViewerProtocolPolicy: "redirect-to-https",
                AllowedMethods: {
                    Quantity: 2,
                    Items: ["HEAD", "GET"],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ["HEAD", "GET"],
                    },
                },
                SmoothStreaming: false,
                Compress: false,
                LambdaFunctionAssociations: {
                    Quantity: 0,
                },
                FieldLevelEncryptionId: "",
                ForwardedValues: {
                    QueryString: true,
                    Cookies: {
                        Forward: "none",
                    },
                    Headers: {
                        Quantity: 0,
                    },
                    QueryStringCacheKeys: {
                        Quantity: 3,
                        Items: ["end", "m", "start"],
                    },
                },
                MinTTL: 0,
                DefaultTTL: 86400,
                MaxTTL: 31536000,
            },
            PriceClass: "PriceClass_100",
            CallerReference: `${new Date().getTime()}`,
            Comment: `CloudFront distribution for ${roomId}`,
            Enabled: true,
        },
    });

    if (!distribution.Distribution?.DomainName || !distribution.Distribution.Id) {
        throw new Error("Failed to create Distribution");
    }

    await CloudFront.tagResource({
        Resource: distribution.Distribution.ARN,
        Tags: {
            Items: [
                {
                    Key: "environment",
                    Value: process.env.AWS_PREFIX ?? "unknown",
                },
            ],
        },
    });

    return {
        id: distribution.Distribution.Id,
        domain: distribution.Distribution.DomainName,
    };
}
