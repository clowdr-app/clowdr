import axios, { AxiosInstance } from "axios";
import { assertType } from "typescript-is";

interface Font {
    family: string;
    styles: string[];
}

interface BuiltInEffect {}

export class OpenShotInfo {
    private baseUrl: string;
    private authToken: string;
    private axios: AxiosInstance;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.axios = axios.create({
            baseURL: `${this.baseUrl}/info`,
        });
        this.axios.defaults.headers.common["Authorization"] = this.authToken;
    }

    public async getFonts(): Promise<Array<Font>> {
        const result = await this.axios.get("/fonts");
        assertType<Array<Font>>(result.data);
        return result.data;
    }

    public async getEffects(): Promise<Array<BuiltInEffect>> {
        const result = await this.axios.get("/effects");
        assertType<Array<BuiltInEffect>>(result.data);
        return result.data;
    }
}
