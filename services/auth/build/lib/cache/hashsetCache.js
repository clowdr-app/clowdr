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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashsetCache = void 0;
var redis_1 = require("../../redis");
var HashsetCache = (function () {
    function HashsetCache(redisRootKey, fetch, refetchAfterMs) {
        if (refetchAfterMs === void 0) { refetchAfterMs = 24 * 60 * 60 * 1000; }
        this.redisRootKey = redisRootKey;
        this.fetch = fetch;
        this.refetchAfterMs = refetchAfterMs;
    }
    HashsetCache.prototype.generateCacheKey = function (itemKey) {
        return this.redisRootKey + ":" + itemKey;
    };
    HashsetCache.prototype.get = function (itemKey, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, redisClient, redisClientReleased, existingVal, lease, _a, val;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/hashsetCache/get")];
                    case 1:
                        redisClient = _b.sent();
                        redisClientReleased = false;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 12, 13]);
                        return [4, redis_1.redisClientP.hgetall(redisClient)(cacheKey)];
                    case 3:
                        existingVal = _b.sent();
                        redis_1.redisClientPool.release("lib/cache/hashsetCache/get", redisClient);
                        redisClientReleased = true;
                        if (existingVal !== null) {
                            return [2, existingVal];
                        }
                        if (!acquireLock) return [3, 5];
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 4:
                        _a = _b.sent();
                        return [3, 6];
                    case 5:
                        _a = undefined;
                        _b.label = 6;
                    case 6:
                        lease = _a;
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, , 10, 11]);
                        console.info("Fetching from original source for hashset cache", cacheKey);
                        return [4, this.fetch(itemKey)];
                    case 8:
                        val = _b.sent();
                        return [4, this.set(itemKey, val, false)];
                    case 9:
                        _b.sent();
                        return [2, val];
                    case 10:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 11: return [3, 13];
                    case 12:
                        if (!redisClientReleased) {
                            redis_1.redisClientPool.release("lib/cache/hashsetcache/get", redisClient);
                        }
                        return [7];
                    case 13: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.getField = function (itemKey, field, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, redisClient, redisClientReleased, existingVal, lease, _a, val;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/hashsetCache/getField")];
                    case 1:
                        redisClient = _b.sent();
                        redisClientReleased = false;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 12, 13]);
                        return [4, redis_1.redisClientP.hget(redisClient)(cacheKey, field)];
                    case 3:
                        existingVal = _b.sent();
                        redis_1.redisClientPool.release("lib/cache/hashsetCache/getField", redisClient);
                        redisClientReleased = true;
                        if (existingVal !== null) {
                            return [2, existingVal];
                        }
                        if (!acquireLock) return [3, 5];
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 4:
                        _a = _b.sent();
                        return [3, 6];
                    case 5:
                        _a = undefined;
                        _b.label = 6;
                    case 6:
                        lease = _a;
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, , 10, 11]);
                        console.info("Fetching from original source for hashset cache", cacheKey);
                        return [4, this.fetch(itemKey)];
                    case 8:
                        val = _b.sent();
                        return [4, this.set(itemKey, val, false)];
                    case 9:
                        _b.sent();
                        return [2, val === null || val === void 0 ? void 0 : val[field]];
                    case 10:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 11: return [3, 13];
                    case 12:
                        if (!redisClientReleased) {
                            redis_1.redisClientPool.release("lib/cache/hashsetcache/getField", redisClient);
                        }
                        return [7];
                    case 13: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.set = function (itemKey, value, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, _a, redisClient;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        if (!acquireLock) return [3, 2];
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 1:
                        _a = _b.sent();
                        return [3, 3];
                    case 2:
                        _a = undefined;
                        _b.label = 3;
                    case 3:
                        lease = _a;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, , 15, 16]);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/hashsetcache/set")];
                    case 5:
                        redisClient = _b.sent();
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, , 13, 14]);
                        if (!value) return [3, 10];
                        return [4, redis_1.redisClientP.del(redisClient)(cacheKey)];
                    case 7:
                        _b.sent();
                        return [4, redis_1.redisClientP.hmset(redisClient)(cacheKey, value)];
                    case 8:
                        _b.sent();
                        return [4, redis_1.redisClientP.expire(redisClient)(cacheKey, this.refetchAfterMs / 1000)];
                    case 9:
                        _b.sent();
                        return [3, 12];
                    case 10: return [4, redis_1.redisClientP.del(redisClient)(cacheKey)];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [3, 14];
                    case 13:
                        redis_1.redisClientPool.release("lib/cache/hashsetcache/set", redisClient);
                        return [7];
                    case 14: return [3, 16];
                    case 15:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 16: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.setField = function (itemKey, field, value, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, _a, redisClient;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        if (!acquireLock) return [3, 2];
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 1:
                        _a = _b.sent();
                        return [3, 3];
                    case 2:
                        _a = undefined;
                        _b.label = 3;
                    case 3:
                        lease = _a;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, , 13, 14]);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/hashsetcache/setField")];
                    case 5:
                        redisClient = _b.sent();
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, , 11, 12]);
                        if (!value) return [3, 8];
                        return [4, redis_1.redisClientP.hset(redisClient)(cacheKey, field, value)];
                    case 7:
                        _b.sent();
                        return [3, 10];
                    case 8: return [4, redis_1.redisClientP.hdel(redisClient)(cacheKey, field)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3, 12];
                    case 11:
                        redis_1.redisClientPool.release("lib/cache/hashsetcache/setField", redisClient);
                        return [7];
                    case 12: return [3, 14];
                    case 13:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 14: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.delete = function (itemKey, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, _a, redisClient;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        if (!acquireLock) return [3, 2];
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 1:
                        _a = _b.sent();
                        return [3, 3];
                    case 2:
                        _a = undefined;
                        _b.label = 3;
                    case 3:
                        lease = _a;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, , 10, 11]);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/hashsetcache/delete")];
                    case 5:
                        redisClient = _b.sent();
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, , 8, 9]);
                        return [4, redis_1.redisClientP.del(redisClient)(cacheKey)];
                    case 7:
                        _b.sent();
                        return [3, 9];
                    case 8:
                        redis_1.redisClientPool.release("lib/cache/hashsetcache/delete", redisClient);
                        return [7];
                    case 9: return [3, 11];
                    case 10:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 11: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.deleteField = function (itemKey, field, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, _a, redisClient;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        if (!acquireLock) return [3, 2];
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 1:
                        _a = _b.sent();
                        return [3, 3];
                    case 2:
                        _a = undefined;
                        _b.label = 3;
                    case 3:
                        lease = _a;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, , 10, 11]);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/hashsetcache/deleteField")];
                    case 5:
                        redisClient = _b.sent();
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, , 8, 9]);
                        return [4, redis_1.redisClientP.hdel(redisClient)(cacheKey, field)];
                    case 7:
                        _b.sent();
                        return [3, 9];
                    case 8:
                        redis_1.redisClientPool.release("lib/cache/hashsetcache/deleteField", redisClient);
                        return [7];
                    case 9: return [3, 11];
                    case 10:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 11: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.update = function (itemKey, value) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, existingValue, newValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 1:
                        lease = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 5, 6]);
                        return [4, this.get(itemKey, false)];
                    case 3:
                        existingValue = _a.sent();
                        newValue = value(existingValue);
                        return [4, this.set(itemKey, newValue, false)];
                    case 4:
                        _a.sent();
                        return [3, 6];
                    case 5:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 6: return [2];
                }
            });
        });
    };
    HashsetCache.prototype.updateField = function (itemKey, field, value) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, existingValue, newValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        return [4, redis_1.redlock.acquire("locks:" + cacheKey, 5000)];
                    case 1:
                        lease = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 5, 6]);
                        return [4, this.getField(itemKey, field, false)];
                    case 3:
                        existingValue = _a.sent();
                        newValue = value(existingValue);
                        return [4, this.setField(itemKey, field, newValue, false)];
                    case 4:
                        _a.sent();
                        return [3, 6];
                    case 5:
                        lease === null || lease === void 0 ? void 0 : lease.unlock();
                        return [7];
                    case 6: return [2];
                }
            });
        });
    };
    return HashsetCache;
}());
exports.HashsetCache = HashsetCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaHNldENhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jYWNoZS9oYXNoc2V0Q2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXFFO0FBRXJFO0lBQ0ksc0JBQ1ksWUFBb0IsRUFDcEIsS0FBbUUsRUFDbkUsY0FBb0M7UUFBcEMsK0JBQUEsRUFBQSxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSTtRQUZwQyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUNwQixVQUFLLEdBQUwsS0FBSyxDQUE4RDtRQUNuRSxtQkFBYyxHQUFkLGNBQWMsQ0FBc0I7SUFDN0MsQ0FBQztJQUVJLHVDQUFnQixHQUF4QixVQUF5QixPQUFlO1FBQ3BDLE9BQVUsSUFBSSxDQUFDLFlBQVksU0FBSSxPQUFTLENBQUM7SUFDN0MsQ0FBQztJQUVLLDBCQUFHLEdBQVQsVUFBVSxPQUFlLEVBQUUsV0FBa0I7UUFBbEIsNEJBQUEsRUFBQSxrQkFBa0I7Ozs7Ozt3QkFDbkMsUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDNUIsV0FBTSx1QkFBZSxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxFQUFBOzt3QkFBekUsV0FBVyxHQUFHLFNBQTJEO3dCQUMzRSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7Ozs7d0JBRVIsV0FBTSxvQkFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBQTs7d0JBQS9ELFdBQVcsR0FBRyxTQUFpRDt3QkFFckUsdUJBQWUsQ0FBQyxPQUFPLENBQUMsNEJBQTRCLEVBQUUsV0FBVyxDQUFDLENBQUM7d0JBQ25FLG1CQUFtQixHQUFHLElBQUksQ0FBQzt3QkFFM0IsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFOzRCQUN0QixXQUFP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