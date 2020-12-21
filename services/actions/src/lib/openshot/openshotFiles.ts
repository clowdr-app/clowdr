import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";
import { OpenShotClient } from "./openshot";
import { Fraction } from "./openshotTypes";

export interface VideoDetails extends BaseDetails {
    media_type: "video";
}

export interface AudioDetails extends BaseDetails {
    media_type: "video";
}

export interface ImageDetails extends BaseDetails {
    media_type: "image";
}

interface BaseDetails {
    acodec: string;
    audio_bit_rate: number;
    audio_stream_index: number;
    audio_timebase: Fraction;
    channel_layout: number;
    channels: number;
    display_ratio: Fraction;
    duration: number;
    file_size: string;
    fps: Fraction;
    has_audio: boolean;
    has_single_image: boolean;
    has_video: boolean;
    height: number;
    interlaced_frame: boolean;
    metadata: any;
    path: string;
    pixel_format: number;
    pixel_ratio: Fraction;
    sample_rate: number;
    top_field_first: boolean;
    type: string;
    vcodec: string;
    video_bit_rate: number;
    video_length: string;
    video_stream_index: number;
    video_timebase: Fraction;
    width: number;
}

export interface File {
    url: string;
    id: number;
    media: string;
    project: string;
    actions: string[];
    json: AudioDetails | VideoDetails | ImageDetails;
    date_created: string;
    date_updated: string;
}

interface TextReplacement {
    search: string;
    replace: string;
}

export class OpenShotFiles {
    private baseUrl: string;
    private authToken: string;
    private axios: AxiosInstance;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.axios = axios.create({
            baseURL: `${this.baseUrl}/files`,
        });
        this.axios.defaults.headers.common["Authorization"] = this.authToken;
    }

    public async uploadUrl(projectId: number, url: string, name: string): Promise<File> {
        const result = await this.axios.post("/", {
            media: null,
            project: OpenShotClient.projects.toUrl(projectId),
            json: {
                url,
                name,
            },
        });
        assertType<File>(result.data);
        return result.data;
    }

    public async uploadS3Url(projectId: number, bucket: string, key: string, name: string): Promise<File> {
        const result = await this.axios.post("/", {
            media: null,
            project: OpenShotClient.projects.toUrl(projectId),
            json: {
                url: key,
                bucket,
                name,
            },
        });
        assertType<File>(result.data);
        return result.data;
    }

    public async getFile(id: number): Promise<File> {
        const result = await this.axios.get(`/${id}`);
        assertType<File>(result.data);
        return result.data;
    }

    public async copyFile(id: number, name: string, projectId: number): Promise<File> {
        const result = await this.axios.post(`/${id}/copy`, {
            name,
            project: projectId,
        });
        assertType<File>(result.data);
        return result.data;
    }

    public async replaceText(id: number, replacement: TextReplacement): Promise<unknown> {
        const result = await this.axios.post(`/${id}/text-replace`, replacement);
        return result.data;
    }

    public toUrl(fileId: number): string {
        return `${this.baseUrl}/files/${fileId}/`;
    }
}
