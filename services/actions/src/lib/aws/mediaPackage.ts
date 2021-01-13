import { v4 as uuidv4 } from "uuid";
import { MediaPackage, shortId } from "./awsClient";

export async function createChannel(roomId: string): Promise<string> {
    const channel = await MediaPackage.createChannel({
        Id: shortId(),
        Tags: { roomId, environment: process.env.AWS_PREFIX ?? "unknown" },
    });
    if (!channel.Id) {
        throw new Error("Failed to create new MediaPackage Channel");
    }
    return channel.Id;
}

export interface OriginEndpoint {
    id: string;
    endpointUri: string;
}

export async function createOriginEndpoint(roomId: string, mediaPackageId: string): Promise<OriginEndpoint> {
    const originEndpoint = await MediaPackage.createOriginEndpoint({
        ChannelId: mediaPackageId,
        Tags: { roomId, environment: process.env.AWS_PREFIX ?? "unknown" },
        Id: shortId(),
        HlsPackage: {
            AdMarkers: "NONE",
            IncludeIframeOnlyStream: false,
            PlaylistType: "EVENT",
            PlaylistWindowSeconds: 60,
            ProgramDateTimeIntervalSeconds: 10,
            SegmentDurationSeconds: 1,
            StreamSelection: {
                MaxVideoBitsPerSecond: 2147483647,
                MinVideoBitsPerSecond: 0,
                StreamOrder: "ORIGINAL",
            },
            UseAudioRenditionGroup: false,
        },
        Origination: "ALLOW",
        StartoverWindowSeconds: 86400,
        TimeDelaySeconds: 0,
    });
    if (originEndpoint.Id && originEndpoint.Url) {
        return { id: originEndpoint.Id, endpointUri: originEndpoint.Url };
    }
    throw new Error("Failed to create OriginEndpoint");
}

export async function createHarvestJob(
    mediaPackageChannelId: string,
    startTime: string,
    endTime: string
): Promise<string> {
    const id = uuidv4();

    const originEndpoints = await MediaPackage.listOriginEndpoints({
        ChannelId: mediaPackageChannelId,
    });

    if (!originEndpoints.OriginEndpoints || originEndpoints.OriginEndpoints.length < 1) {
        throw new Error("No origin endpoints found for MediaPackage channel");
    }

    const originEndpoint = originEndpoints.OriginEndpoints[0];

    const result = await MediaPackage.createHarvestJob({
        EndTime: endTime,
        StartTime: startTime,
        Id: id,
        OriginEndpointId: originEndpoint.Id,
        S3Destination: {
            BucketName: process.env.AWS_CONTENT_BUCKET_ID,
            ManifestKey: `${id}.m3u8`,
            RoleArn: process.env.AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN,
        },
    });

    if (!result.Id) {
        throw new Error("Failed to start MediaPackage harvest job");
    }

    return result.Id;
}
