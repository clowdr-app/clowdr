import type { OriginEndpoint as ClientOriginEndpoint } from "@aws-sdk/client-mediapackage";
import { paginateListOriginEndpoints } from "@aws-sdk/client-mediapackage";
import { v4 as uuidv4 } from "uuid";
import { MediaPackage } from "./awsClient";

export interface OriginEndpoint {
    id: string;
    endpointUri: string;
}

export async function createHarvestJob(
    mediaPackageChannelId: string,
    scheduledStartTime: string,
    scheduledEndTime: string
): Promise<string> {
    const id = uuidv4();

    const originEndpoints: ClientOriginEndpoint[] = [];

    const paginator = paginateListOriginEndpoints(
        {
            client: MediaPackage,
        },
        {
            ChannelId: mediaPackageChannelId,
        }
    );

    for await (const page of paginator) {
        originEndpoints.push(...(page.OriginEndpoints ?? []));
    }

    if (!originEndpoints || originEndpoints.length < 1) {
        throw new Error("No origin endpoints found for MediaPackage channel");
    }

    const originEndpoint = originEndpoints[0];

    const result = await MediaPackage.createHarvestJob({
        EndTime: scheduledEndTime,
        StartTime: scheduledStartTime,
        Id: id,
        OriginEndpointId: originEndpoint.Id,
        S3Destination: {
            BucketName: process.env.AWS_CONTENT_BUCKET_ID,
            ManifestKey: `${id}/index.m3u8`,
            RoleArn: process.env.AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN,
        },
    });

    if (!result.Id) {
        throw new Error("Failed to start MediaPackage harvest job");
    }

    return result.Id;
}
