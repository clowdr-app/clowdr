import { createRedisClient } from "@midspace/component-clients/redis";
import { Emitter } from "@socket.io/redis-emitter";

export const emitter = new Emitter(createRedisClient());
