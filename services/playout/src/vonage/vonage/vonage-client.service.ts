import type { Bunyan} from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Inject, Injectable } from "@nestjs/common";
import OpenTok from "opentok";
import { promisify } from "util";
import { VONAGE_MODULE_OPTIONS } from "../../constants";
import type { VonageOptions } from "../vonage.module";

@Injectable()
export class VonageClientService {
    private readonly logger: Bunyan;

    private _vonage: OpenTok;

    constructor(@RootLogger() logger: Bunyan, @Inject(VONAGE_MODULE_OPTIONS) private config: VonageOptions) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    onModuleInit(): void {
        this._vonage = new OpenTok(this.config.apiKey, this.config.apiSecret);
    }

    public async createSession(options: OpenTok.SessionOptions): Promise<OpenTok.Session | undefined> {
        const fn = promisify(this._vonage.createSession.bind(this._vonage));
        return await fn(options);
    }
}
