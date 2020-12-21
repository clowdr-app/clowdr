import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";
import { Project } from "./openshotProjects";
import { Export } from "./openshotTypes";

interface Exports {
    count: number;
    next: unknown | null;
    previous: unknown | null;
    results: Array<Export>;
}

interface S3ExportDetails {
    bucket: string;
    url: string;
    acl: string;
}

interface ExportParameters {
    export_type: "video" | "audio" | "image" | "waveform";
    video_format: string;
    video_codec: string;
    video_bitrate: number;
    audio_codec: string;
    audio_bitrate: number;
    start_frame: number;
    end_frame: number;
    project: string;
    webhook: string;
    json: Partial<Project> & Maybe<S3ExportDetails> & { webhookKey?: string };
}

export class OpenShotExports {
    private baseUrl: string;
    private authToken: string;
    private axios: AxiosInstance;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.axios = axios.create({
            baseURL: `${this.baseUrl}/exports`,
        });
        this.axios.defaults.headers.common["Authorization"] = this.authToken;
    }

    public async getExports(): Promise<Exports> {
        const result = await this.axios.get("/");
        assertType<Exports>(result.data);
        return result.data;
    }

    public async createExport(params: ExportParameters): Promise<Export> {
        const result = await this.axios.post("/", params);
        assertType<Export>(result.data);
        return result.data;
    }

    public async getExport(id: number): Promise<Export> {
        const result = await this.axios.get(`/${id}`);
        assertType<Project>(result.data);
        return result.data;
    }

    public async deleteExport(id: number): Promise<void> {
        await this.axios.delete(`/${id}`);
    }

    public async retryExport(id: number): Promise<{ detail: string }> {
        const result = await this.axios.post(`/${id}/retry`);
        assertType<{ detail: string }>(result.data);
        return result.data;
    }
}
