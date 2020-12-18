import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";

export interface Project {
    url: string;
    id: number;
    name: string;
    width: number;
    height: number;
    fps_num: number;
    fps_den: 1;
    sample_rate: number;
    channels: number;
    channel_layout: ChannelLayout;
    files: string[];
    clips: string[];
    effects: string[];
    exports: string[];
    actions: string[];
    json: any;
    date_created: string;
    date_updated: string;
}

interface Projects {
    count: number;
    next: unknown | null;
    previous: unknown | null;
    results: Array<Project>;
}

enum ChannelLayout {
    STEREO = 3,
    MONO = 4,
    SURROUND = 7,
}

interface ProjectParameters {
    name: string;
    width: number;
    height: number;
    fps_num: number;
    fps_den: number;
    sample_rate: number;
    channels: number;
    channel_layout: ChannelLayout;
}

export class OpenShotProjects {
    private baseUrl: string;
    private authToken: string;
    private axios: AxiosInstance;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.axios = axios.create({
            baseURL: `${this.baseUrl}/projects`,
        });
        this.axios.defaults.headers.common["Authorization"] = this.authToken;
    }

    public async getProjects(): Promise<Projects> {
        const result = await this.axios.get("/");
        assertType<Projects>(result.data);
        return result.data;
    }

    public async createProject(params: ProjectParameters): Promise<Project> {
        const result = await this.axios.post("/", params);
        assertType<Project>(result.data);
        return result.data;
    }

    public async getProject(id: number): Promise<Project> {
        const result = await this.axios.get(`/${id}`);
        assertType<Project>(result.data);
        return result.data;
    }

    public async updateProject(
        id: number,
        params: Partial<ProjectParameters>
    ): Promise<Project> {
        const result = await this.axios.patch(`/${id}`, params);
        assertType<Project>(result.data);
        return result.data;
    }

    public async copyProject(id: number, name: string): Promise<Project> {
        const result = await this.axios.post(`/${id}/copy`, { name });
        assertType<Project>(result.data);
        return result.data;
    }

    public async validateProject(id: number): Promise<boolean> {
        const result = await this.axios.get(`/${id}/validate`);
        assertType<{ detail: string }>(result.data);
        return result.data.detail === "Your project is valid!";
    }
}
