import { DynamicModule, FactoryProvider, Global, Module, ModuleMetadata } from "@nestjs/common";
import { VONAGE_MODULE_OPTIONS } from "../constants";
import { VonageClientService } from "./vonage/vonage-client.service";

export type VonageOptions = {
    apiKey: string;
    apiSecret: string;
};

@Global()
@Module({
    providers: [],
    exports: [],
})
export class VonageModule {
    static forRootAsync(
        config: Omit<FactoryProvider<VonageOptions | Promise<VonageOptions>>, "provide"> &
            Pick<ModuleMetadata, "imports">
    ): DynamicModule {
        return {
            module: VonageModule,
            imports: config.imports ?? [],
            providers: [
                VonageClientService,
                {
                    provide: VONAGE_MODULE_OPTIONS,
                    useFactory: config.useFactory,
                    inject: config.inject,
                },
            ],
            exports: [VonageClientService],
        };
    }
}
