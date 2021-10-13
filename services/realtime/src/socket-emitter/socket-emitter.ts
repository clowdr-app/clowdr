import { Emitter } from "@socket.io/redis-emitter";
import { createRedisClient } from "../redis";

export const emitter = new Emitter(createRedisClient());
