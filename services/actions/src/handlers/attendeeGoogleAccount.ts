import { gql } from "@apollo/client/core";
import {
    YouTubeChannelDetails,
    YouTubeDataBlob,
    YouTubePlaylistDetails,
} from "@clowdr-app/shared-types/build/attendeeGoogleAccount";
import assert from "assert";
import { Credentials } from "google-auth-library";
import { google, youtube_v3 } from "googleapis";
import * as R from "ramda";
import {
    AttendeeGoogleAccount_GetAttendeeGoogleAccountDocument,
    AttendeeGoogleAccount_UpdateAttendeeGoogleAccountDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getAttendeeByConferenceSlug } from "../lib/authorisation";
import { createOAuth2Client } from "../lib/googleAuth";
import { AttendeeGoogleAccountData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";

export async function handleAttendeeGoogleAccountDeleted(payload: Payload<AttendeeGoogleAccountData>): Promise<void> {
    assert(payload.event.data.old, "Payload must contain old row data");
    const oldRow = payload.event.data.old;

    const accessToken = oldRow.tokenData.access_token;

    if (accessToken) {
        console.log("Revoking credentials for attendee Google account", oldRow.id);
        const oauth2Client = createOAuth2Client();
        await callWithRetry(async () => await oauth2Client.revokeToken(accessToken));
        console.log("Revoked credentials for attendee Google account", oldRow.id);
    }
    return;
}

gql`
    query AttendeeGoogleAccount_GetAttendeeGoogleAccount($id: uuid!) {
        AttendeeGoogleAccount_by_pk(id: $id) {
            attendeeId
            id
            tokenData
            youTubeData
        }
    }

    mutation AttendeeGoogleAccount_UpdateAttendeeGoogleAccount($attendeeGoogleAccountId: uuid!, $youTubeData: jsonb!) {
        update_AttendeeGoogleAccount_by_pk(
            pk_columns: { id: $attendeeGoogleAccountId }
            _set: { youTubeData: $youTubeData }
        ) {
            id
        }
    }
`;

export async function handleRefreshYouTubeData(
    payload: refreshYouTubeDataArgs,
    userId: string,
    conferenceSlug: string
): Promise<RefreshYouTubeDataOutput> {
    let attendee;
    try {
        attendee = await getAttendeeByConferenceSlug(userId, conferenceSlug);
    } catch (e) {
        console.error(
            "User is not authorised to refresh YouTube data",
            payload.attendeeGoogleAccountId,
            userId,
            conferenceSlug,
            e
        );
        throw new Error("User is not authorised to refresh YouTube data");
    }

    const attendeeGoogleAccount = await apolloClient.query({
        query: AttendeeGoogleAccount_GetAttendeeGoogleAccountDocument,
        variables: {
            id: payload.attendeeGoogleAccountId,
        },
    });

    if (
        !attendeeGoogleAccount.data ||
        !attendeeGoogleAccount.data.AttendeeGoogleAccount_by_pk?.attendeeId ||
        attendeeGoogleAccount.data.AttendeeGoogleAccount_by_pk.attendeeId !== attendee.id
    ) {
        console.error(
            "Could not find matching Google account for attendee",
            payload.attendeeGoogleAccountId,
            userId,
            conferenceSlug
        );
        throw new Error("Could not find Google account");
    }

    const client = createOAuth2Client();
    client.setCredentials({ ...attendeeGoogleAccount.data.AttendeeGoogleAccount_by_pk.tokenData } as Credentials);
    const youtubeClient = google.youtube({
        auth: client,
        version: "v3",
    });

    const channels = await youtubeClient.channels.list({
        mine: true,
        part: ["snippet", "id"],
        maxResults: 50,
    });

    let allPlaylists: youtube_v3.Schema$Playlist[] = [];
    let nextPageToken;
    do {
        const playlists: youtube_v3.Schema$PlaylistListResponse = (
            await youtubeClient.playlists.list({
                mine: true,
                part: ["snippet", "id"],
                maxResults: 50,
                pageToken: nextPageToken,
            })
        ).data;
        if (!playlists.items) {
            break;
        }
        allPlaylists = R.concat(allPlaylists, playlists.items);
        if (playlists.nextPageToken) {
            nextPageToken = playlists.nextPageToken;
        } else {
            nextPageToken = undefined;
        }
    } while (nextPageToken);

    const youTubeData: YouTubeDataBlob = {
        channels:
            channels.data.items?.map(
                (channel): YouTubeChannelDetails => {
                    const playlists = allPlaylists.filter((p) => p.snippet && p.snippet.channelId === channel.id);
                    return {
                        description: channel.snippet?.description ?? "",
                        title: channel.snippet?.title ?? "<unknown title>",
                        id: channel.id ?? "",
                        playlists: playlists.map(
                            (p): YouTubePlaylistDetails => ({
                                id: p.id ?? "",
                                title: p.snippet?.title ?? "<unknown title>",
                                description: p.snippet?.description ?? "",
                            })
                        ),
                    };
                }
            ) ?? [],
    };

    await apolloClient.mutate({
        mutation: AttendeeGoogleAccount_UpdateAttendeeGoogleAccountDocument,
        variables: {
            attendeeGoogleAccountId: payload.attendeeGoogleAccountId,
            youTubeData,
        },
    });

    return { success: true };
}
