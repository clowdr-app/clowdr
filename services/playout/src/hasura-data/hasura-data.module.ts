import { DynamicModule, FactoryProvider, Global, Module, ModuleMetadata } from "@nestjs/common";
import { HASURA_MODULE_OPTIONS } from "../constants";
import { ConferenceConfigurationService } from "./conference-configuration/conference-configuration.service";
import { GraphQlService } from "./graphql/graphql.service";
import { LocalScheduleService } from "./local-schedule/local-schedule.service";
import { MediaLiveChannelService } from "./media-live-channel/media-live-channel.service";

export type HasuraDataModuleOptions = {
    useSecureProtocols: boolean;
    graphQlApiDomain: string;
    hasuraAdminSecret: string;
};

@Global()
@Module({
    providers: [GraphQlService, MediaLiveChannelService, LocalScheduleService, ConferenceConfigurationService],
    exports: [GraphQlService, MediaLiveChannelService, LocalScheduleService, ConferenceConfigurationService],
})
export class HasuraDataModule {
    static forRootAsync(
        config: Omit<FactoryProvider<HasuraDataModuleOptions | Promise<HasuraDataModuleOptions>>, "provide"> &
            Pick<ModuleMetadata, "imports">
    ): DynamicModule {
        return {
            module: HasuraDataModule,
            imports: config.imports ?? [],
            providers: [
                {
                    provide: HASURA_MODULE_OPTIONS,
                    useFactory: config.useFactory,
                    inject: config.inject,
                },
                GraphQlService,
            ],
            exports: [GraphQlService],
        };
    }
}
