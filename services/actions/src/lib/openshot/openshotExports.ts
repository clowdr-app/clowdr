import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";
import { Project } from "./openshotProjects";

interface Export {
    url: string;
    id: number;
    output: string;
    export_type: string;
    video_format: string;
    video_codec: string;
    video_bitrate: number;
    audio_codec: string;
    audio_bitrate: number;
    start_frame: number;
    end_frame: number;
    actions: string[];
    project: string;
    webhook: string;
    json: any;
    progress: number;
    status: string;
    date_created: string;
    date_updated: string;
}

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
    export_type: string;
    video_format: string;
    video_codec: string;
    video_bitrate: number;
    audio_codec: string;
    audio_bitrate: number;
    start_frame: number;
    end_frame: number;
    project: string;
    webhook: string;
    json: Partial<Project> & Maybe<S3ExportDetails>;
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

    public async retryExport(id: number): Promise<{ detail: string }> {
        const result = await this.axios.post(`/${id}/retry`);
        assertType<{ detail: string }>(result.data);
        return result.data;
    }
}
