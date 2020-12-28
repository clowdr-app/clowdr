import { MediaPackage, shortId } from "../../aws/awsClient";

export async function createChannel(roomId: string): Promise<string> {
    const channel = await MediaPackage.createChannel({
        Id: shortId(),
        Tags: { roomId },
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
        Tags: { roomId },
        Id: shortId(),
        HlsPackage: {
            AdMarkers: "NONE",
            IncludeIframeOnlyStream: false,
            PlaylistType: "EVENT",
            PlaylistWindowSeconds: 60,
            ProgramDateTimeIntervalSeconds: 0,
            SegmentDurationSeconds: 1,
            StreamSelection: {
                MaxVideoBitsPerSecond: 2147483647,
                MinVideoBitsPerSecond: 0,
                StreamOrder: "ORIGINAL",
            },
            UseAudioRenditionGroup: false,
        },
        Origination: "ALLOW",
        StartoverWindowSeconds: 300,
        TimeDelaySeconds: 0,
    });
    if (originEndpoint.Id && originEndpoint.Url) {
        return { id: originEndpoint.Id, endpointUri: originEndpoint.Url };
    }
    throw new Error("Failed to create OriginEndpoint");
}
