import { gql } from "@apollo/client/core";
import type { Bunyan} from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import type { ClassConstructor} from "class-transformer";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import {
    ConferenceConfiguration_GetConfigurationValueDocument,
    Conference_ConfigurationKey_Enum,
} from "../../generated/graphql";
import type { GraphQlService } from "../graphql/graphql.service";

export class ConferenceConfigurationService {
    private readonly logger: Bunyan;
    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getConferenceConfiguration(conferenceId: string, key: Conference_ConfigurationKey_Enum): Promise<any> {
        gql`
            query ConferenceConfiguration_GetConfigurationValue(
                $key: conference_ConfigurationKey_enum!
                $conferenceId: uuid!
            ) {
                conference_Configuration_by_pk(conferenceId: $conferenceId, key: $key) {
                    conferenceId
                    key
                    value
                }
            }
        `;
        const result = await this.graphQlService.apolloClient.query({
            query: ConferenceConfiguration_GetConfigurationValueDocument,
            variables: {
                conferenceId,
                key,
            },
        });

        return result.data.conference_Configuration_by_pk ? result.data.conference_Configuration_by_pk.value : null;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public async getConferenceConfigurationAndValidate<T extends object>(
        cls: ClassConstructor<T>,
        conferenceId: string,
        key: Conference_ConfigurationKey_Enum
    ): Promise<T | null> {
        const result = await this.graphQlService.apolloClient.query({
            query: ConferenceConfiguration_GetConfigurationValueDocument,
            variables: {
                conferenceId,
                key,
            },
        });

        if (result.data.conference_Configuration_by_pk) {
            const transformed = plainToClass(cls, result.data.conference_Configuration_by_pk.value);
            const errors = await validate(transformed);
            if (errors.length > 1) {
                return null;
            } else {
                return result.data.conference_Configuration_by_pk.value;
            }
        } else {
            return null;
        }
    }

    public async getFillerVideos(conferenceId: string): Promise<string[] | null> {
        const result = await this.getConferenceConfiguration(
            conferenceId,
            Conference_ConfigurationKey_Enum.FillerVideos
        );
        const valid = Array.isArray(result) && result.every((x) => typeof x === "string");
        return valid ? result : null;
    }
}
