import { DynamicModule, FactoryProvider, Global, Module, ModuleMetadata } from "@nestjs/common";
import { AWS_MODULE_OPTIONS } from "../constants";
import { AwsService } from "./aws.service";

export type AwsModuleOptions = {
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    prefix: string;
    region: string;
    mediaLiveServiceRoleArn: string;
};

@Global()
@Module({
    providers: [AwsService],
    exports: [AwsService],
})
export class AwsModule {
    static forRoot(config: AwsModuleOptions): DynamicModule {
        return {
            module: AwsModule,
            imports: [],
            providers: [
                AwsService,
                {
                    provide: AWS_MODULE_OPTIONS,
                    useValue: config,
                },
            ],
            exports: [AwsService],
        };
    }

    static forRootAsync(
        config: Omit<FactoryProvider<AwsModuleOptions | Promise<AwsModuleOptions>>, "provide"> &
            Pick<ModuleMetadata, "imports">
    ): DynamicModule {
        return {
            module: AwsModule,
            imports: config.imports ?? [],
            providers: [
                AwsService,
                {
                    provide: AWS_MODULE_OPTIONS,
                    useFactory: config.useFactory,
                    inject: config.inject,
                },
            ],
            exports: [AwsService],
        };
    }
}
