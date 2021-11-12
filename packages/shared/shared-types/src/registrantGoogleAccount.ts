import { assertType, is } from "typescript-is";

export interface YouTubeDataBlob {
    channels: YouTubeChannelDetails[];
}

export interface YouTubeChannelDetails {
    id: string;
    title: string;
    description: string;
    playlists: YouTubePlaylistDetails[];
}

export interface YouTubePlaylistDetails {
    id: string;
    title: string;
    description: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isYouTubeDataBlob(data: any): boolean {
    return is<YouTubeDataBlob>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsYouTubeDataBlob(data: any): asserts data is YouTubeDataBlob {
    assertType<YouTubeDataBlob>(data);
}
