import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";
import { AudioDetails, ImageDetails, VideoDetails } from "./openshotFiles";
import { Points } from "./openshotTypes";

interface ClipDetails {
    alpha: Points;
    anchor: number;
    channel_filter: Points;
    channel_mapping: Points;
    display: 0;
    gravity: number;
    has_audio: Points;
    has_video: Points;
    location_x: Points;
    location_y: Points;
    image: string;
    reader: VideoDetails | AudioDetails | ImageDetails;
    rotation: Points;
    scale: number;
    scale_y: Points;
    scale_x: Points;
    shear_x: Points;
    shear_y: Points;
    time: Points;
    title: string;
    volume: Points;
    waveform: boolean;
    wave_color: {
        blue: Points;
        alpha: Points;
        green: Points;
        red: Points;
    };
}

interface Clip {
    url: string;
    file: string;
    id: number;
    position: number;
    start: number;
    end: number;
    layer: number;
    actions: string[];
    project: string;
    json: ClipDetails;
    date_created: string;
    date_updated: string;
}

interface ClipParameters {
    project: string;
    position: number;
    start: number;
    end: number;
    layer: number;
    file: string;
    json: any;
}

interface Clips {
    count: number;
    next: unknown | null;
    previous: unknown | null;
    results: Array<Clip>;
}

export class OpenShotClips {
    private baseUrl: string;
    private authToken: string;
    private axios: AxiosInstance;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.axios = axios.create({
            baseURL: `${this.baseUrl}/clips`,
        });
        this.axios.defaults.headers.common["Authorization"] = this.authToken;
    }

    public async getClips(): Promise<Clips> {
        const result = await this.axios.get("/");
        assertType<Clip>(result.data);
        return result.data;
    }

    public async createClip(params: ClipParameters): Promise<Clip> {
        const result = await this.axios.post("/", params);
        assertType<Clip>(result.data);
        return result.data;
    }

    public async getClip(id: number): Promise<Clip> {
        const result = await this.axios.get(`/${id}`);
        assertType<Clip>(result.data);
        return result.data;
    }

    public toUrl(clipId: number): string {
        return `${this.baseUrl}/clips/${clipId}/`;
    }
}
