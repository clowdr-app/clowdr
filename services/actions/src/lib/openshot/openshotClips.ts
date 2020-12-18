import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";
import { AudioDetails, VideoDetails } from "./openshotFiles";
import { Points } from "./openshotTypes";

interface ClipDetails {
    anchor: number;
    channel_filter: Points;
    waveform: boolean;
    scale_x: Points;
    has_video: Points;
    has_audio: Points;
    location_y: Points;
    alpha: Points;
    image: string;
    shear_x: Points;
    shear_y: Points;
    rotation: Points;
    reader: VideoDetails | AudioDetails;
    scale: number;
    channel_mapping: Points;
    gravity: number;
    scale_y: Points;
    volume: Points;
    title: string;
    wave_color: {
        blue: Points;
        alpha: Points;
        green: Points;
        red: Points;
    };
    display: 0;
    time: Points;
    location_x: Points;
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
    position: number;
    start: number;
    end: number;
    layer: number;
    file: string;
    project: string;
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
}
