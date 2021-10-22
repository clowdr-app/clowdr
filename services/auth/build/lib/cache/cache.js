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
exports.Cache = void 0;
var redis_1 = require("../../redis");
var Cache = (function () {
    function Cache(redisRootKey, fetch, stringify, parse, refetchAfterMs, rateLimitPeriodMs) {
        if (refetchAfterMs === void 0) { refetchAfterMs = 24 * 60 * 60 * 1000; }
        if (rateLimitPeriodMs === void 0) { rateLimitPeriodMs = 3 * 60 * 1000; }
        this.redisRootKey = redisRootKey;
        this.fetch = fetch;
        this.stringify = stringify;
        this.parse = parse;
        this.refetchAfterMs = refetchAfterMs;
        this.rateLimitPeriodMs = rateLimitPeriodMs;
    }
    Cache.prototype.generateCacheKey = function (itemKey) {
        return this.redisRootKey + ":" + itemKey;
    };
    Cache.prototype.get = function (itemKey, refetchNow, acquireLock) {
        if (refetchNow === void 0) { refetchNow = false; }
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, redisClient, redisClientReleased, existingValStr, existingVal, fetchedAt, lease, _a, val;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.generateCacheKey(itemKey);
                        return [4, redis_1.redisClientPool.acquire("lib/cache/cache/get")];
                    case 1:
                        redisClient = _b.sent();
                        redisClientReleased = false;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 12, 13]);
                        return [4, redis_1.redisClientP.get(redisClient)(cacheKey)];
                    case 3:
                        existingValStr = _b.sent();
                        redis_1.redisClientPool.release("lib/cache/cache/get", redisClient);
                        redisClientReleased = true;
                        if (existingValStr !== null) {
                            existingVal = JSON.parse(existingValStr);
                            fetchedAt = existingVal.fetchedAt;
                            if (existingVal.value === "undefined" || refetchNow) {
                                if (Date.now() - fetchedAt < this.rateLimitPeriodMs) {
                                    return [2, existingVal.value === "undefined" ? undefined : this.parse(existingVal.value)];
                                }
                            }
                            else {
                                return [2, this.parse(existingVal.value)];
                            }
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
                        console.info("Fetching from original source for cache", cacheKey);
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
                            redis_1.redisClientPool.release("lib/cache/cache/get", redisClient);
                        }
                        return [7];
                    case 13: return [2];
                }
            });
        });
    };
    Cache.prototype.set = function (itemKey, value, acquireLock) {
        if (acquireLock === void 0) { acquireLock = true; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, lease, _a, redisClient, valStr;
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
                        return [4, redis_1.redisClientPool.acquire("lib/cache/cache/set")];
                    case 5:
                        redisClient = _b.sent();
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, , 8, 9]);
                        valStr = value !== undefined ? this.stringify(value) : "undefined";
                        return [4, redis_1.redisClientP.set(redisClient)(cacheKey, JSON.stringify({ fetchedAt: Date.now(), value: valStr }), "PX", Date.now() + this.refetchAfterMs)];
                    case 7:
                        _b.sent();
                        return [3, 9];
                    case 8:
                        redis_1.redisClientPool.release("lib/cache/cache/set", redisClient);
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
    Cache.prototype.delete = function (itemKey, acquireLock) {
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
                        return [4, redis_1.redisClientPool.acquire("lib/cache/cache/delete")];
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
                        redis_1.redisClientPool.release("lib/cache/cache/delete", redisClient);
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
    Cache.prototype.update = function (itemKey, value) {
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
                        return [4, this.get(itemKey, false, false)];
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
    return Cache;
}());
exports.Cache = Cache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NhY2hlL2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFDQUFxRTtBQUVyRTtJQUNJLGVBQ1ksWUFBb0IsRUFDcEIsS0FBOEMsRUFDOUMsU0FBK0IsRUFDL0IsS0FBMkIsRUFDM0IsY0FBb0MsRUFDcEMsaUJBQWlDO1FBRGpDLCtCQUFBLEVBQUEsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUk7UUFDcEMsa0NBQUEsRUFBQSxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJO1FBTGpDLGlCQUFZLEdBQVosWUFBWSxDQUFRO1FBQ3BCLFVBQUssR0FBTCxLQUFLLENBQXlDO1FBQzlDLGNBQVMsR0FBVCxTQUFTLENBQXNCO1FBQy9CLFVBQUssR0FBTCxLQUFLLENBQXNCO1FBQzNCLG1CQUFjLEdBQWQsY0FBYyxDQUFzQjtRQUNwQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWdCO0lBQzFDLENBQUM7SUFFSSxnQ0FBZ0IsR0FBeEIsVUFBeUIsT0FBZTtRQUNwQyxPQUFVLElBQUksQ0FBQyxZQUFZLFNBQUksT0FBUyxDQUFDO0lBQzdDLENBQUM7SUFFSyxtQkFBRyxHQUFULFVBQVUsT0FBZSxFQUFFLFVBQWtCLEVBQUUsV0FBa0I7UUFBdEMsMkJBQUEsRUFBQSxrQkFBa0I7UUFBRSw0QkFBQSxFQUFBLGtCQUFrQjs7Ozs7O3dCQUN2RCxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM1QixXQUFNLHVCQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEVBQUE7O3dCQUFsRSxXQUFXLEdBQUcsU0FBb0Q7d0JBQ3BFLG1CQUFtQixHQUFHLEtBQUssQ0FBQzs7Ozt3QkFFTCxXQUFNLG9CQUFZLENBQUMs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