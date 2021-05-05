import { gql } from "@apollo/client/core";
import AmazonS3URI from "amazon-s3-uri";
import { GetConferenceIdFromChannelResourceIdDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { MediaLive, shortId } from "./aws/awsClient";
import { getConferenceConfiguration } from "./conferenceConfiguration";

export async function switchToFillerVideo(channelResourceId: string): Promise<void> {
    console.log("Switching to filler video", channelResourceId);

    // Figure out which conference this MediaLive channel belongs to
    gql`
        query GetConferenceIdFromChannelResourceId($channelResourceId: String!) {
            video_MediaLiveChannel(where: { mediaLiveChannelId: { _eq: $channelResourceId } }) {
                id
                room {
                    id
                    conferenceId
                }
            }
        }
    `;

    const conferenceIdResult = await apolloClient.query({
        query: GetConferenceIdFromChannelResourceIdDocument,
        variables: {
            channelResourceId,
        },
    });

    if (conferenceIdResult.error || conferenceIdResult.errors) {
        console.error(
            "Error while retrieving conference ID for MediaLive channel resource",
            channelResourceId,
            conferenceIdResult.error,
            conferenceIdResult.errors
        );
        return;
    }

    if (
        conferenceIdResult.data.video_MediaLiveChannel.length !== 1 ||
        !conferenceIdResult.data.video_MediaLiveChannel[0].room
    ) {
        console.error(
            "Expected exactly one conference to be associated with MediaLive channel resource",
            channelResourceId
        );
        return;
    }

    const conferenceId = conferenceIdResult.data.video_MediaLiveChannel[0].room.conferenceId;

    let fillerVideoKey;
    try {
        fillerVideoKey = await getFillerVideos(conferenceId);
    } catch (e) {
        console.warn("Could not find filler video, will not switch to it.");
        return;
    }

    // Determine which input is the looping one
    const channelDescription = await MediaLive.describeChannel({
        ChannelId: channelResourceId,
    });

    const loopingAttachmentName = channelDescription.InputAttachments?.find((attachment) =>
        attachment.InputAttachmentName?.endsWith("-looping")
    )?.InputAttachmentName;

    if (!loopingAttachmentName) {
        console.error(
            "Could not find the looping attachment on the MediaLive channel.",
            channelResourceId,
            channelDescription.InputAttachments
        );
        return;
    }

    await MediaLive.batchUpdateSchedule({
        ChannelId: channelResourceId,
        Creates: {
            ScheduleActions: [
                {
                    ActionName: `${shortId()}-fallback`,
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference: loopingAttachmentName,
                            UrlPath: [fillerVideoKey],
                        },
                    },
                    ScheduleActionStartSettings: {
                        ImmediateModeScheduleActionStartSettings: {},
                    },
                },
            ],
        },
    });
}

async function getFillerVideos(conferenceId: string): Promise<string> {
    let urlPath;
    try {
        const fillerVideosConfiguration = await getConferenceConfiguration<string[]>(conferenceId, "FILLER_VIDEOS");
        if (!fillerVideosConfiguration || fillerVideosConfiguration.length < 1) {
            throw new Error("Could not retrieve FILLER_VIDEOS configuration for conference");
        }

        const { key } = new AmazonS3URI(fillerVideosConfiguration[0]);
        urlPath = key;
    } catch (e) {
        console.error("Error parsing filler video URI", conferenceId, e);
    }

    if (!urlPath) {
        console.error("Could not parse filler video URI", conferenceId, urlPath);
        throw new Error("Could not parse filler video URI");
    }

    return urlPath;
}
