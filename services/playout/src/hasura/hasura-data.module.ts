import { DynamicModule, FactoryProvider, Global, Module, ModuleMetadata } from "@nestjs/common";
import { HASURA_MODULE_OPTIONS } from "../constants";
import { ChannelStackCreateJobService } from "./channel-stack-create-job/channel-stack-create-job.service";
import { GraphQlService } from "./graphql.service";
import { MediaLiveChannelService } from "./media-live-channel/media-live-channel.service";

export type HasuraModuleOptions = {
    useSecureProtocols: boolean;
    graphQlApiDomain: string;
    hasuraAdminSecret: string;
};

@Global()
@Module({
    providers: [GraphQlService, ChannelStackCreateJobService, MediaLiveChannelService],
    exports: [GraphQlService, ChannelStackCreateJobService, MediaLiveChannelService],
})
export class HasuraDataModule {
    static forRootAsync(
        config: Omit<FactoryProvider<HasuraModuleOptions | Promise<HasuraModuleOptions>>, "provide"> &
            Pick<ModuleMetadata, "imports">
    ): DynamicModule {
        return {
            module: HasuraDataModule,
            imports: config.imports ?? [],
            providers: [
                GraphQlService,
                {
                    provide: HASURA_MODULE_OPTIONS,
                    useFactory: config.useFactory,
                    inject: config.inject,
                },
            ],
            exports: [GraphQlService],
        };
    }
}
