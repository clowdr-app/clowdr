import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import type Redlock from "redlock";
import { ChatCache } from "./chat";
import { ConferenceCache } from "./conference";
import { ConferenceRoomsCache } from "./conferenceRoom";
import { EventCache } from "./event";
import { ChatPinsCache } from "./pin";
import { PushNotificationSubscriptionsCache } from "./pushNotificationSubscriptions";
import { ReadUpToIndexCache } from "./readUpToIndex";
import { RegistrantCache } from "./registrant";
import { RoomCache } from "./room";
import { RoomMembershipsCache } from "./roomMembership";
import { SubconferenceCache } from "./subconference";
import { SubconferenceRoomsCache } from "./subconferenceRoom";
import { ChatSubscriptionsCache } from "./subscription";
import { UserCache } from "./user";

export class Caches {
    constructor(
        private readonly redisClientPool: RedisClientPool,
        private readonly redlock: Redlock,
        private readonly gqlClient: GQLClient
    ) {}

    public readonly chat = new ChatCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly conference = new ConferenceCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly conferenceRooms = new ConferenceRoomsCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly event = new EventCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly chatPins = new ChatPinsCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly pushNotificationSubscriptions = new PushNotificationSubscriptionsCache(
        this.redisClientPool,
        this.redlock,
        this.gqlClient
    );
    public readonly readUpToIndices = new ReadUpToIndexCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly registrant = new RegistrantCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly room = new RoomCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly roomMemberships = new RoomMembershipsCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly subconference = new SubconferenceCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly subconferenceRooms = new SubconferenceRoomsCache(
        this.redisClientPool,
        this.redlock,
        this.gqlClient
    );
    public readonly chatSubscriptions = new ChatSubscriptionsCache(this.redisClientPool, this.redlock, this.gqlClient);
    public readonly user = new UserCache(this.redisClientPool, this.redlock, this.gqlClient);
}
