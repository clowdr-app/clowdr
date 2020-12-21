import assert from "assert";
import axios from "axios";
import axiosBetterStacktrace from "axios-better-stacktrace";
import { OpenShotClips } from "./openshotClips";
import { OpenShotEffects } from "./openshotEffects";
import { OpenShotExports } from "./openshotExports";
import { OpenShotFiles } from "./openshotFiles";
import { OpenShotInfo } from "./openshotInfo";
import { OpenShotProjects } from "./openshotProjects";

axiosBetterStacktrace(axios);

assert(process.env.OPENSHOT_BASE_URL, "OPENSHOT_BASE_URL environment variable must be specified");
assert(process.env.OPENSHOT_USERNAME, "OPENSHOT_USERNAME environment variable must be specified");
assert(process.env.OPENSHOT_PASSWORD, "OPENSHOT_PASSWORD environment variable must be specified");

export class OpenShot {
    private baseUrl: string;
    private username: string;
    private password: string;

    public projects: OpenShotProjects;
    public files: OpenShotFiles;
    public clips: OpenShotClips;
    public effects: OpenShotEffects;
    public exports: OpenShotExports;
    public info: OpenShotInfo;

    constructor(baseUrl: string, username: string, password: string) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        const authHeader = this.authHeader();
        this.projects = new OpenShotProjects(this.baseUrl, authHeader);
        this.files = new OpenShotFiles(this.baseUrl, authHeader);
        this.clips = new OpenShotClips(this.baseUrl, authHeader);
        this.effects = new OpenShotEffects(this.baseUrl, authHeader);
        this.exports = new OpenShotExports(this.baseUrl, authHeader);
        this.info = new OpenShotInfo(this.baseUrl, authHeader);
    }

    private authHeader(): string {
        const token = Buffer.from(this.username + ":" + this.password).toString("base64");
        return `Basic ${token}`;
    }
}

export const OpenShotClient = new OpenShot(
    process.env.OPENSHOT_BASE_URL,
    process.env.OPENSHOT_USERNAME,
    process.env.OPENSHOT_PASSWORD
);
