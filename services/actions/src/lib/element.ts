import { gql } from "@apollo/client/core";
import type { Maybe } from "@midspace/hasura/action-types";
import type {
    BroadcastTranscodeDetails,
    Content_ElementType_Enum,
    ElementDataBlob,
    ElementVersionData,
    TranscodeDetails,
    VideoElementBlob,
} from "@midspace/shared-types/content";
import { ElementBaseType } from "@midspace/shared-types/content";
import assert from "assert";
import type { P } from "pino";
import R from "ramda";
import { is } from "typescript-is";
import { ElementAddNewVersionDocument, GetElementByIdDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query GetElementById($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            id
            data
            typeName
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function extractLatestVersion(data: any): Maybe<ElementVersionData> {
    if (!is<ElementDataBlob>(data)) {
        return null;
    }

    const latestVersion = R.last(data);

    return latestVersion ?? null;
}

export async function getLatestVersion(
    elementId: string
): Promise<{ latestVersion: Maybe<ElementVersionData>; typeName: Content_ElementType_Enum }> {
    const result = await apolloClient.query({
        query: GetElementByIdDocument,
        variables: {
            elementId,
        },
    });

    if (!result.data.content_Element_by_pk) {
        throw new Error("Could not find content item");
    }

    return {
        latestVersion: extractLatestVersion(result.data.content_Element_by_pk.data),
        typeName: result.data.content_Element_by_pk.typeName,
    };
}

export async function createNewVersionFromPreviewTranscode(
    elementId: string,
    transcodeDetails: TranscodeDetails
): Promise<ElementVersionData> {
    const { latestVersion } = await getLatestVersion(elementId);
    assert(latestVersion, "Could not find latest version of content item data");

    const newVersion = R.clone(latestVersion);
    assert(is<VideoElementBlob>(newVersion.data), "Content item is not a video");

    newVersion.data.transcode = transcodeDetails;
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    return newVersion;
}

export async function createNewVersionFromBroadcastTranscode(
    elementId: string,
    transcodeDetails: BroadcastTranscodeDetails
): Promise<ElementVersionData> {
    const { latestVersion, typeName } = await getLatestVersion(elementId);

    const newVersion = R.clone(
        latestVersion ??
            ({
                createdAt: new Date().getTime(),
                createdBy: "system",
                data: {
                    baseType: ElementBaseType.Video,
                    s3Url: "",
                    subtitles: {},
                    type: typeName,
                },
            } as ElementVersionData)
    );
    assert(is<VideoElementBlob>(newVersion.data), "Content item is not a video");

    newVersion.data.broadcastTranscode = transcodeDetails;
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    return newVersion;
}

export async function addNewElementVersion(
    logger: P.Logger,
    elementId: string,
    version: ElementVersionData
): Promise<void> {
    const result = await apolloClient.mutate({
        mutation: ElementAddNewVersionDocument,
        variables: {
            id: elementId,
            newVersion: version,
        },
    });

    if (result.errors) {
        logger.error({ errors: result.errors }, "Failed to add new content item version");
        throw new Error(`Failed to add new content item version: ${result.errors}`);
    }
}

export async function addNewBroadcastTranscode(
    logger: P.Logger,
    elementId: string,
    s3Url: string,
    durationSeconds: number | null
): Promise<void> {
    logger.info({ elementId }, "Updating content item with result of broadcast transcode");
    const transcodeDetails: BroadcastTranscodeDetails = {
        updatedTimestamp: new Date().getTime(),
        durationSeconds: durationSeconds ?? undefined,
        s3Url,
    };
    const newVersion = await createNewVersionFromBroadcastTranscode(elementId, transcodeDetails);
    await addNewElementVersion(logger, elementId, newVersion);
}
