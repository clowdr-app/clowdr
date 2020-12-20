import { OpenShotClips } from "./openshotClips";
import { OpenShotProjects } from "./openshotProjects";

export class OpenShot {
    private baseUrl: string;
    private username: string;
    private password: string;

    public projects: OpenShotProjects;
    public clips: OpenShotClips;

    constructor(baseUrl: string, username: string, password: string) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        const authHeader = this.authHeader();
        this.projects = new OpenShotProjects(this.baseUrl, authHeader);
        this.clips = new OpenShotClips(this.baseUrl, authHeader);
    }

    private authHeader(): string {
        const token = Buffer.from(this.username + ":" + this.password).toString("base64");
        return `Basic ${token}`;
    }
}
