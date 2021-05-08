import {
    BatchUpdateScheduleCommand,
    ChannelState,
    DescribeChannelCommand,
    DescribeChannelResponse,
    DescribeScheduleCommand,
    ListChannelsCommand,
    MediaLive,
    ScheduleAction,
    StartChannelCommand,
    StopChannelCommand,
} from "@aws-sdk/client-medialive";
import { Credentials as NewSdkCredentials } from "@aws-sdk/types";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Inject, Injectable } from "@nestjs/common";
import { AWS_MODULE_OPTIONS } from "../../constants";
import { AwsModuleOptions } from "../aws.module";

@Injectable()
export class MediaLiveService {
    private readonly logger: Bunyan;

    private readonly credentials: NewSdkCredentials;
    private readonly region: string;
    private _mediaLive: MediaLive;

    constructor(@RootLogger() logger: Bunyan, @Inject(AWS_MODULE_OPTIONS) config: AwsModuleOptions) {
        this.logger = logger.child({ component: this.constructor.name });

        this.credentials = config.credentials;
        this.region = config.region;
    }

    onModuleInit(): void {
        this._mediaLive = new MediaLive({
            credentials: this.credentials,
            region: this.region,
        });
    }

    public async getChannelState(channelId: string): Promise<ChannelState | string | null> {
        const description = await this._mediaLive.describeChannel({
            ChannelId: channelId,
        });

        return description.State ?? null;
    }

    public async describeSchedule(channelId: string): Promise<ScheduleAction[]> {
        const action = new DescribeScheduleCommand({ ChannelId: channelId });
        const result = await this._mediaLive.send(action);
        if (!result.ScheduleActions) {
            throw new Error("Could not retrieve MediaLive schedule");
        }
        return result.ScheduleActions;
    }

    public async updateSchedule(
        channelId: string,
        deleteActionNames: string[],
        createActions: ScheduleAction[]
    ): Promise<void> {
        const action = new BatchUpdateScheduleCommand({
            Deletes: {
                ActionNames: deleteActionNames,
            },
            Creates: {
                ScheduleActions: createActions,
            },
            ChannelId: channelId,
        });
        await this._mediaLive.send(action);
    }

    public async channelExists(channelId: string): Promise<boolean> {
        const command = new ListChannelsCommand({});
        const result = await this._mediaLive.send(command);
        return !!result.Channels?.find((channel) => channel.Id === channelId);
    }

    public async startChannel(channelId: string): Promise<void> {
        const command = new StartChannelCommand({ ChannelId: channelId });
        await this._mediaLive.send(command);
    }

    public async stopChannel(channelId: string): Promise<void> {
        const command = new StopChannelCommand({ ChannelId: channelId });
        await this._mediaLive.send(command);
    }

    public async describeChannel(channelId: string): Promise<DescribeChannelResponse> {
        const command = new DescribeChannelCommand({ ChannelId: channelId });
        const result = await this._mediaLive.send(command);
        return result;
    }
}
