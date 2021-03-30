import { Emitter } from "@socket.io/redis-emitter";
import { redisClient } from "../redis";

export const emitter = new Emitter(redisClient);
