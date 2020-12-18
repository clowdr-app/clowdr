import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";
import { Points } from "./openshotTypes";

interface EffectDetails {
    name: string;
    brightness: Points;
    contrast: Points;
    short_name: string;
    description: string;
    reader: any;
    class_name: string;
    replace_image: boolean;
    has_audio: boolean;
    has_video: boolean;
    order: number;
}

interface Effect {
    url: string;
    id: number;
    title: string;
    type: string;
    position: number;
    start: number;
    end: number;
    layer: number;
    project: string;
    json: EffectDetails;
}

interface Effects {
    count: number;
    next: null | unknown;
    previous: null | unknown;
    results: Array<Effect>;
}

interface EffectParameters {
    title: string;
    type: string;
    position: number;
    start: number;
    end: number;
    layer: number;
    project: string;
    json: Partial<EffectDetails>;
}

export class OpenShotEffects {
    private baseUrl: string;
    private authToken: string;
    private axios: AxiosInstance;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.axios = axios.create({
            baseURL: `${this.baseUrl}/effects`,
        });
        this.axios.defaults.headers.common["Authorization"] = this.authToken;
    }

    public async getEffects(): Promise<Effects> {
        const result = await this.axios.get("/");
        assertType<Effects>(result.data);
        return result.data;
    }

    public async createEffect(params: EffectParameters): Promise<Effect> {
        const result = await this.axios.post("/", params);
        assertType<Effect>(result.data);
        return result.data;
    }

    public async getEffect(id: number): Promise<Effect> {
        const result = await this.axios.get(`/${id}`);
        assertType<Effect>(result.data);
        return result.data;
    }
}
