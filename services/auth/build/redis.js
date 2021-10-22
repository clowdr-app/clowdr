"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClientP = exports.redlock = exports.redisClientPool = exports.createRedisClient = void 0;
var assert_1 = __importDefault(require("assert"));
var generic_pool_1 = __importDefault(require("generic-pool"));
var redis_1 = __importDefault(require("redis"));
var redlock_1 = __importDefault(require("redlock"));
var util_1 = require("util");
function createRedisClient() {
    assert_1.default(process.env.REDIS_URL, "REDIS_URL env var not defined.");
    var redisExists = false;
    return redis_1.default.createClient(process.env.REDIS_URL, {
        retry_strategy: function (options) {
            if (options.error && options.error.code === "ECONNREFUSED" && (!redisExists || options.attempt >= 75)) {
                return new Error("The server refused the connection");
            }
            redisExists = true;
            if (options.total_retry_time > 1000 * 60 * 60 * 3) {
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 1000) {
                return undefined;
            }
            if (options.attempt % 5 === 0) {
                return 10 * 60 * 1000;
            }
            else {
                return 30 * 1000;
            }
        },
    });
}
exports.createRedisClient = createRedisClient;
var clientFactory = {
    create: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, createRedisClient()];
            });
        });
    },
    destroy: function (client) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                client.quit();
                return [2];
            });
        });
    },
};
var poolOpts = {
    max: process.env.MAX_REDIS_CONNECTIONS ? parseInt(process.env.MAX_REDIS_CONNECTIONS, 10) : 10,
    min: process.env.MIN_REDIS_CONNECTIONS ? parseInt(process.env.MIN_REDIS_CONNECTIONS, 10) : 2,
};
var _redisClientPool = generic_pool_1.default.createPool(clientFactory, poolOpts);
exports.redisClientPool = {
    acquire: function (_caller) {
        return _redisClientPool.acquire();
    },
    release: function (_caller, client) {
        return _redisClientPool.release(client);
    },
};
var redlockRedisClient = createRedisClient();
exports.redlock = new redlock_1.default([redlockRedisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 1000,
    retryJitter: 500,
});
exports.redisClientP = {
    get: function (redisClient) { return util_1.promisify(redisClient.get).bind(redisClient); },
    set: function (redisClient) {
        return util_1.promisify(function (key, value, mode, duration, cb) {
            return redisClient.set(key, value, mode, duration, cb);
        });
    },
    setForever: function (redisClient) {
        return util_1.promisify(function (key, value, cb) { return redisClient.set(key, value, cb); });
    },
    del: function (redisClient) { return util_1.promisify(function (key, cb) { return redisClient.del(key, cb); }); },
    sadd: function (redisClient) {
        return util_1.promisify(function (key, value, cb) { return redisClient.sadd(key, value, cb); });
    },
    srem: function (redisClient) {
        return util_1.promisify(function (key, value, cb) { return redisClient.srem(key, value, cb); });
    },
    smembers: function (redisClient) {
        return util_1.promisify(function (key, cb) { return redisClient.smembers(key, cb); });
    },
    scan: function (redisClient) {
        return util_1.promisify(function (cursor, pattern, cb) {
            return redisClient.scan(cursor, "match", pattern, cb);
        });
    },
    zadd: function (redisClient) {
        return util_1.promisify(function (key, score, member, cb) {
            return redisClient.zadd(key, score, member, cb);
        });
    },
    zrem: function (redisClient) {
        return util_1.promisify(function (key, member, cb) { return redisClient.zrem(key, member, cb); });
    },
    zrange: function (redisClient) {
        return util_1.promisify(function (key, start, stop, cb) {
            return redisClient.zrange(key, start, stop, cb);
        });
    },
    zremrangebyrank: function (redisClient) {
        return util_1.promisify(function (key, start, stop, cb) {
            return redisClient.zremrangebyrank(key, start, stop, cb);
        });
    },
    zcard: function (redisClient) { return util_1.promisify(function (key, cb) { return redisClient.zcard(key, cb); }); },
    zrevrank: function (redisClient) {
        return util_1.promisify(function (key, member, cb) { return redisClient.zrevrank(key, member, cb); });
    },
    incr: function (redisClient) { return util_1.promisify(function (key, cb) { return redisClient.incr(key, cb); }); },
    getset: function (redisClient) {
        return util_1.promisify(function (key, value, cb) { return redisClient.getset(key, value, cb); });
    },
    hget: function (redisClient) {
        return util_1.promisify(function (key, field, cb) { return redisClient.hget(key, field, cb); });
    },
    hset: function (redisClient) {
        return util_1.promisify(function (key, field, value, cb) {
            return redisClient.hset(key, field, value, cb);
        });
    },
    hdel: function (redisClient) {
        return util_1.promisify(function (key, field, cb) { return redisClient.hdel(key, field, cb); });
    },
    hgetall: function (redisClient) {
        return util_1.promisify(function (key, cb) { return redisClient.hgetall(key, cb); });
    },
    hmset: function (redisClient) {
        return util_1.promisify(function (key, value, cb) {
            return redisClient.hmset(key, value, cb);
        });
    },
    expire: function (redisClient) {
        return util_1.promisify(function (key, seconds, cb) { return redisClient.expire(key, seconds, cb); });
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVkaXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esa0RBQTRCO0FBQzVCLDhEQUF1QztBQUV2QyxnREFBMEI7QUFDMUIsb0RBQThCO0FBQzlCLDZCQUFpQztBQUVqQyxTQUFnQixpQkFBaUI7SUFDN0IsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO0lBRWhFLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztJQUN4QixPQUFPLGVBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUU7UUFDN0MsY0FBYyxFQUFFLFVBQUMsT0FBTztZQUVwQixJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUFJLENBQUMsQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsRUFBRTtnQkFDbkcsT0FBTyxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2FBQ3pEO1lBRUQsV0FBVyxHQUFHLElBQUksQ0FBQztZQUVuQixJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQy9DLE9BQU8sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQzthQUM1QztZQUNELElBQUksT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLEVBQUU7Z0JBQ3hCLE9BQU8sU0FBUyxDQUFDO2FBQ3BCO1lBR0QsSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzNCLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7YUFDekI7aUJB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