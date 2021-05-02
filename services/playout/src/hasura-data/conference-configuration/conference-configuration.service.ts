import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { ClassConstructor, plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { ConferenceConfiguration_GetConfigurationValueDocument } from "../../generated/graphql";
import { GraphQlService } from "../graphql/graphql.service";

export class ConferenceConfigurationService {
    private readonly logger: Bunyan;
    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getConferenceConfiguration(conferenceId: string, key: string): Promise<any> {
        gql`
            query ConferenceConfiguration_GetConfigurationValue($key: String!, $conferenceId: uuid!) {
                ConferenceConfiguration(where: { key: { _eq: $key }, conferenceId: { _eq: $conferenceId } }) {
                    id
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

        return result.data.ConferenceConfiguration.length > 0 ? result.data.ConferenceConfiguration[0].value : null;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public async getConferenceConfigurationAndValidate<T extends object>(
        cls: ClassConstructor<T>,
        conferenceId: string,
        key: string
    ): Promise<T | null> {
        const result = await this.graphQlService.apolloClient.query({
            query: ConferenceConfiguration_GetConfigurationValueDocument,
            variables: {
                conferenceId,
                key,
            },
        });

        if (result.data.ConferenceConfiguration.length > 0) {
            const transformed = plainToClass(cls, result.data.ConferenceConfiguration[0].value);
            const errors = await validate(transformed);
            if (errors.length > 1) {
                return null;
            } else {
                return result.data.ConferenceConfiguration[0].value;
            }
        } else {
            return null;
        }
    }

    public async getFillerVideos(conferenceId: string): Promise<string[] | null> {
        const result = await this.getConferenceConfiguration(conferenceId, "FILLER_VIDEOS");
        const valid = Array.isArray(result) && result.every((x) => typeof x === "string");
        return valid ? result : null;
    }
}
