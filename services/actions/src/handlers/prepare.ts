import { gql } from "@apollo/client/core";
import { ContentItemDataBlob, ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import {
    CreateBroadcastContentItemDocument,
    CreateVideoRenderJobDocument,
    FailConferencePrepareJobDocument,
    GetEventTitleDetailsDocument,
    GetVideoBroadcastContentItemsDocument,
    OtherConferencePrepareJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { ConferencePrepareJobData, Payload } from "../types/event";

gql`
    query OtherConferencePrepareJobs($conferenceId: uuid!, $conferencePrepareJobId: uuid!) {
        ConferencePrepareJob(
            where: {
                jobStatusName: { _eq: IN_PROGRESS }
                conferenceId: { _eq: $conferenceId }
                id: { _neq: $conferencePrepareJobId }
            }
        ) {
            id
            updatedAt
        }
    }

    mutation FailConferencePrepareJob($id: uuid!, $message: String!) {
        update_ConferencePrepareJob_by_pk(pk_columns: { id: $id }, _set: { jobStatusName: FAILED, message: $message }) {
            id
        }
    }

    query GetVideoBroadcastContentItems($conferenceId: uuid) {
        ContentItem(where: { conferenceId: { _eq: $conferenceId }, contentTypeName: { _eq: VIDEO_BROADCAST } }) {
            id
            data
        }
    }

    mutation CreateVideoRenderJob($conferenceId: uuid!, $conferencePrepareJobId: uuid!, $data: jsonb!) {
        insert_VideoRenderJob_one(
            object: { conferenceId: $conferenceId, conferencePrepareJobId: $conferencePrepareJobId, data: $data }
        ) {
            id
        }
    }

    mutation CreateBroadcastContentItem($conferenceId: uuid!, $contentItemId: uuid!, $input: jsonb!) {
        insert_BroadcastContentItem_one(
            object: { conferenceId: $conferenceId, contentItemId: $contentItemId, inputTypeName: MP4, input: $input }
        ) {
            id
        }
    }

    query GetEventTitleDetails($conferenceId: uuid!) {
        Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                contentGroup: { contentItems: { contentTypeName: { _in: [VIDEO_BROADCAST] } } }
                intendedRoomModeName: { _eq: PRERECORDED }
            }
        ) {
            id
            contentGroup {
                id
                title
                contentItems(
                    distinct_on: contentTypeName
                    where: { contentTypeName: { _eq: VIDEO_BROADCAST } }
                    order_by: { contentTypeName: asc }
                    limit: 1
                ) {
                    contentItemPeople(distinct_on: id) {
                        person {
                            name
                            id
                        }
                        id
                    }
                    contentTypeName
                    id
                }
            }
            intendedRoomModeName
            name
        }
    }
`;

export async function handleConferencePrepareJobInserted(payload: Payload<ConferencePrepareJobData>): Promise<void> {
    //todo
    assert(payload.event.data.new, "Payload must contain new row data");

    // get list of other in-progress jobs. If any are in progress, set this new one to failed and return.
    const otherJobs = await apolloClient.query({
        query: OtherConferencePrepareJobsDocument,
        variables: {
            conferenceId: payload.event.data.new.conferenceId,
            conferencePrepareJobId: payload.event.data.new.id,
        },
    });

    if (otherJobs.data.ConferencePrepareJob.length > 0) {
        await apolloClient.mutate({
            mutation: FailConferencePrepareJobDocument,
            variables: {
                id: payload.event.data.new.id,
                message: "Another job is already in progress",
            },
        });
        return;
    }

    // else, continue
    // cleanup previous?
    // Get all video broadcast content items for this conference
    const videoBroadcastItems = await apolloClient.query({
        query: GetVideoBroadcastContentItemsDocument,
        variables: {
            conferenceId: payload.event.data.new.conferenceId,
        },
    });

    // For each video broadcast, add a broadcast content item if the item
    // has already been transcoded for broadcast. Else fire off a transcoding job.
    for (const videoBroadcastItem of videoBroadcastItems.data.ContentItem) {
        const content: ContentItemDataBlob = videoBroadcastItem.data;

        if (content.length < 1) {
            continue;
        }

        const latestVersion = content[content.length - 1];

        if (latestVersion.data.type !== ContentType_Enum.VideoBroadcast) {
            continue;
        }

        if (
            latestVersion.data.broadcastTranscode &&
            latestVersion.data.broadcastTranscode.message === "COMPLETED" &&
            latestVersion.data.broadcastTranscode.s3Url
        ) {
            const broadcastItemInput: MP4Input = {
                s3Url: latestVersion.data.broadcastTranscode.s3Url,
                type: "MP4Input",
            };

            await apolloClient.mutate({
                mutation: CreateBroadcastContentItemDocument,
                variables: {
                    conferenceId: payload.event.data.new.conferenceId,
                    contentItemId: videoBroadcastItem.id,
                    input: broadcastItemInput,
                },
            });
        } else {
            const broadcastRenderJobData: BroadcastRenderJobData = {
                type: "BroadcastRenderJob",
                subtitlesS3Url: latestVersion.data.subtitles["en_US"].s3Url,
                videoS3Url: latestVersion.data.s3Url,
            };

            await apolloClient.mutate({
                mutation: CreateVideoRenderJobDocument,
                variables: {
                    conferenceId: payload.event.data.new.conferenceId,
                    conferencePrepareJobId: payload.event.data.new.id,
                    data: broadcastRenderJobData,
                },
            });
        }
    }

    const eventsResult = await apolloClient.query({
        query: GetEventTitleDetailsDocument,
        variables: {
            conferenceId: payload.event.data.new.conferenceId,
        },
    });

    for (const event of eventsResult.data.Event) {
        if (!event.contentGroup || event.contentGroup.contentItems.length < 1) {
            continue;
        }

        const contentItem = event.contentGroup?.contentItems[0];

        const names = contentItem.contentItemPeople.map((person) => person.person.name);
        const eventTitle = event.name;

        //if (contentItem)
    }

    // TODO: listen to BroadcastRenderJob insertions and start a transcode
    // TODO: modify mediaconvert webhook to differentiate preview and broadcast transcodes

    // get list of all events for this conference
    // for each event's content group, create content items for title slides and so on if they do not exist
    // trigger title slide generation job for each event
    // create transitions
}
