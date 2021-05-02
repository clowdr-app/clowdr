import { gql } from "@apollo/client/core";
import {
    YouTubeChannelDetails,
    YouTubeDataBlob,
    YouTubePlaylistDetails,
} from "@clowdr-app/shared-types/build/registrantGoogleAccount";
import assert from "assert";
import { Credentials } from "google-auth-library";
import { google, youtube_v3 } from "googleapis";
import * as R from "ramda";
import {
    RegistrantGoogleAccount_GetRegistrantGoogleAccountDocument,
    RegistrantGoogleAccount_UpdateRegistrantGoogleAccountDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createOAuth2Client } from "../lib/googleAuth";
import { Payload, RegistrantGoogleAccountData } from "../types/hasura/event";
import { callWithRetry } from "../utils";

export async function handleRegistrantGoogleAccountDeleted(
    payload: Payload<RegistrantGoogleAccountData>
): Promise<void> {
    assert(payload.event.data.old, "Payload must contain old row data");
    const oldRow = payload.event.data.old;

    const accessToken = oldRow.tokenData.access_token;

    if (accessToken) {
        console.log("Revoking credentials for registrant Google account", oldRow.id);
        const oauth2Client = createOAuth2Client();
        await callWithRetry(async () => await oauth2Client.revokeToken(accessToken));
        console.log("Revoked credentials for registrant Google account", oldRow.id);
    }
    return;
}

gql`
    query RegistrantGoogleAccount_GetRegistrantGoogleAccount($id: uuid!) {
        registrant_GoogleAccount_by_pk(id: $id) {
            registrantId
            id
            tokenData
            youTubeData
        }
    }

    mutation RegistrantGoogleAccount_UpdateRegistrantGoogleAccount(
        $registrantGoogleAccountId: uuid!
        $youTubeData: jsonb!
    ) {
        update_registrant_GoogleAccount_by_pk(
            pk_columns: { id: $registrantGoogleAccountId }
            _set: { youTubeData: $youTubeData }
        ) {
            id
        }
    }
`;

export async function handleRefreshYouTubeData(payload: refreshYouTubeDataArgs): Promise<RefreshYouTubeDataOutput> {
    const registrantGoogleAccount = await apolloClient.query({
        query: RegistrantGoogleAccount_GetRegistrantGoogleAccountDocument,
        variables: {
            id: payload.registrantGoogleAccountId,
        },
    });

    if (
        !registrantGoogleAccount.data ||
        !registrantGoogleAccount.data.registrant_GoogleAccount_by_pk?.registrantId ||
        registrantGoogleAccount.data.registrant_GoogleAccount_by_pk.registrantId !== payload.registrantId
    ) {
        console.error("Could not find matching Google account for registrant", payload.registrantGoogleAccountId);
        throw new Error("Could not find Google account");
    }

    const client = createOAuth2Client();
    client.setCredentials({ ...registrantGoogleAccount.data.registrant_GoogleAccount_by_pk.tokenData } as Credentials);
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
        mutation: RegistrantGoogleAccount_UpdateRegistrantGoogleAccountDocument,
        variables: {
            registrantGoogleAccountId: payload.registrantGoogleAccountId,
            youTubeData,
        },
    });

    return { success: true };
}
