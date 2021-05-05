import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import {
    VonageService_CreateEventVonageSessionDocument,
    VonageService_FindEventsWithMissingVonageSessionDocument,
} from "../../generated/graphql";
import { GraphQlService } from "../../hasura-data/graphql/graphql.service";
import { VonageClientService } from "../../vonage/vonage/vonage-client.service";

@Injectable()
export class VonageService {
    private logger: Bunyan;

    constructor(
        @RootLogger() logger: Bunyan,
        private graphQlService: GraphQlService,
        private vonageClientService: VonageClientService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async createMissingEventVonageSessions(): Promise<void> {
        gql`
            query VonageService_FindEventsWithMissingVonageSession {
                schedule_Event(
                    where: { _not: { eventVonageSession: {} }, intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] } }
                ) {
                    id
                    conferenceId
                }
            }
        `;

        this.logger.info("Looking for missing event Vonage sessions");

        const result = await this.graphQlService.apolloClient.query({
            query: VonageService_FindEventsWithMissingVonageSessionDocument,
        });

        this.logger.info({ count: result.data.schedule_Event.length }, "Creating event Vonage sessions where missing");

        await Promise.all(
            result.data.schedule_Event.map(
                async (event) => await this.createEventVonageSession(event.id, event.conferenceId)
            )
        );
    }

    public async createEventVonageSession(eventId: string, conferenceId: string): Promise<void> {
        const result = await this.vonageClientService.createSession({ mediaMode: "routed" });

        if (!result) {
            throw new Error("Could not create event vonage session: no session ID returned from Vonage.");
        }

        gql`
            mutation VonageService_CreateEventVonageSession(
                $eventId: uuid!
                $conferenceId: uuid!
                $sessionId: String!
            ) {
                insert_video_EventVonageSession_one(
                    object: { eventId: $eventId, conferenceId: $conferenceId, sessionId: $sessionId }
                    on_conflict: { constraint: EventVonageSession_eventId_key, update_columns: sessionId }
                ) {
                    id
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: VonageService_CreateEventVonageSessionDocument,
            variables: {
                eventId,
                conferenceId,
                sessionId: result.sessionId,
            },
        });
    }
}
