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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
var body_parser_1 = require("body-parser");
var express_1 = __importDefault(require("express"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var jwks_rsa_1 = __importDefault(require("jwks-rsa"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var typescript_is_1 = require("typescript-is");
var hasura_1 = require("../http-handlers/hasura");
exports.router = express_1.default.Router();
var _jwksClient;
var _openIdConfig;
function getOpenIdConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!_openIdConfig) return [3, 3];
                    return [4, node_fetch_1.default("https://" + process.env.AUTH0_API_DOMAIN + "/.well-known/openid-configuration")];
                case 1:
                    response = _a.sent();
                    return [4, response.json()];
                case 2:
                    _openIdConfig = _a.sent();
                    _a.label = 3;
                case 3:
                    if (_openIdConfig && !_jwksClient) {
                        _jwksClient = jwks_rsa_1.default({
                            cache: true,
                            rateLimit: true,
                            jwksRequestsPerMinute: 1,
                            jwksUri: _openIdConfig.jwks_uri,
                        });
                    }
                    return [2, {
                            jwksClient: _jwksClient,
                            openIdConfig: _openIdConfig,
                        }];
            }
        });
    });
}
exports.router.post("/auth", body_parser_1.json({ limit: "20mb" }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, _a, openIdConfig, jwksClient, getHeader, decodedToken, encodedToken, completeDecodedToken, key, _b, userId, conferenceId, subconferenceId, roomId, magicToken, inviteCode, role, includeRoomIds, result, e_1;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                try {
                    typescript_is_1.assertType(req.body, function (object) { var path = ["$"]; function _string(object) { ; if (typeof object !== "string")
                        return { message: "validation failed at " + path.join(".") + ": expected a string", path: path.slice(), reason: { type: "string" } };
                    else
                        return null; } function _1530(object) {
                        var e_2, _a;
                        ;
                        if (typeof object !== "object" || object === null || Array.isArray(object))
                            return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } };
                        try {
                            for (var _b = __values(Object.keys(object)), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var key = _c.value;
                                path.push(key);
                                var error = _string(object[key]);
                                path.pop();
                                if (error)
                                    return error;
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        return null;
                    } function _null(object) { ; if (object !== null)
                        return { message: "validation failed at " + path.join(".") + ": expected null", path: path.slice(), reason: { type: "null" } };
                    else
                        return null; } function _any() { return null; } function _146(object) {
                        var e_3, _a;
                        ;
                        if (typeof object !== "object" || object === null || Array.isArray(object))
                            return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } };
                        try {
                            for (var _b = __values(Object.keys(object)), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var key = _c.value;
                                path.push(key);
                                var error = _any(object[key]);
                                path.pop();
                                if (error)
                                    return error;
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        return null;
                    } function _1532(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
                        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
                        if ("variables" in object) {
                            path.push("variables");
                            var error = _146(object["variables"]);
                            path.pop();
                            if (error)
                                return error;
                        }
                    } {
                        if ("operationName" in object) {
                            path.push("operationName");
                            var error = _string(object["operationName"]);
                            path.pop();
                            if (error)
                                return error;
                        }
                    } {
                        if ("query" in object) {
                            path.push("query");
                            var error = _string(object["query"]);
                            path.pop();
                            if (error)
                                return error;
                        }
                        else
                            return { message: "validation failed at " + path.join(".") + ": expected 'query' in object", path: path.slice(), reason: { type: "missing-property", property: "query" } };
                    } return null; } function su__null__1532_eu(object) { if (object === null)
                        return null;
                    else
                        return _1532(object); } function _1529(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
                        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
                        if ("headers" in object) {
                            path.push("headers");
                            var error = _1530(object["headers"]);
                            path.pop();
                            if (error)
                                return error;
                        }
                        else
                            return { message: "validation failed at " + path.join(".") + ": expected 'headers' in object", path: path.slice(), reason: { type: "missing-property", property: "headers" } };
                    } {
                        if ("request" in object) {
                            path.push("request");
                            var error = su__null__1532_eu(object["request"]);
                            path.pop();
                            if (error)
                                return error;
                        }
                    } return null; } var error = _1529(object); return error; });
                }
                catch (e) {
                    console.error(req.originalUrl + ": received incorrect payload", e);
                    res.status(500).json("Unexpected payload");
                    return [2];
                }
                payload = req.body;
                _e.label = 1;
            case 1:
                _e.trys.push([1, 9, , 10]);
                return [4, getOpenIdConfig()];
            case 2:
                _a = _e.sent(), openIdConfig = _a.openIdConfig, jwksClient = _a.jwksClient;
                getHeader = function (normalcaseHeaderName) {
                    if (payload.headers[normalcaseHeaderName]) {
                        var header = payload.headers[normalcaseHeaderName];
                        if (typeof header === "string") {
                            return header;
                        }
                    }
                    var lowercaseHeaderName = normalcaseHeaderName.toLowerCase();
                    if (payload.headers[lowercaseHeaderName]) {
                        var header = payload.headers[lowercaseHeaderName];
                        if (typeof header === "string") {
                            return header;
                        }
                    }
                    var uppercaseHeaderName = normalcaseHeaderName.toUpperCase();
                    if (payload.headers[uppercaseHeaderName]) {
                        var header = payload.headers[uppercaseHeaderName];
                        if (typeof header === "string") {
                            return header;
                        }
                    }
                    return undefined;
                };
                decodedToken = null;
                encodedToken = (_c = getHeader("Authorization")) === null || _c === void 0 ? void 0 : _c.split(" ")[1];
                if (!(encodedToken && typeof encodedToken === "string")) return [3, 7];
                completeDecodedToken = jsonwebtoken_1.default.decode(encodedToken, { complete: true });
                _e.label = 3;
            case 3:
                _e.trys.push([3, 6, , 7]);
                if (!(completeDecodedToken && typeof completeDecodedToken !== "string")) return [3, 5];
                return [4, jwksClient.getSigningKey(completeDecodedToken.header.kid)];
            case 4:
                key = _e.sent();
                decodedToken = jsonwebtoken_1.default.verify(encodedToken, key.getPublicKey(), {
                    algorithms: [key.alg],
                    audience: (_d = process.env.JWT_AUDIENCE) !== null && _d !== void 0 ? _d : "hasura",
                    issuer: openIdConfig.issuer,
                });
                _e.label = 5;
            case 5: return [3, 7];
            case 6:
                _b = _e.sent();
                return [3, 7];
            case 7:
                userId = decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken["sub"];
                conferenceId = getHeader("X-Auth-Conference-Id");
                subconferenceId = getHeader("X-Auth-Subconference-Id");
                roomId = getHeader("X-Auth-Room-Id");
                magicToken = getHeader("X-Auth-Magic-Token");
                inviteCode = getHeader("X-Auth-Invite-Code");
                role = getHeader("X-Auth-Role");
                includeRoomIds = getHeader("X-Auth-Include-Room-Ids");
                return [4, hasura_1.handleAuthWebhook(payload, { userId: userId }, {
                        conferenceId: conferenceId,
                        subconferenceId: subconferenceId,
                        roomId: roomId,
                        magicToken: magicToken,
                        inviteCode: inviteCode,
                        role: role,
                        includeRoomIds: (includeRoomIds === null || includeRoomIds === void 0 ? void 0 : includeRoomIds.toLowerCase()) === "true",
                    })];
            case 8:
                result = _e.sent();
                console.log(result);
                if (result !== false) {
                    res.status(200).json(result);
                }
                else {
                    res.status(401).json("Unauthorized");
                }
                return [3, 10];
            case 9:
                e_1 = _e.sent();
                console.error("Failure while handling Hasura Auth webhook", e_1);
                res.status(500).json("Failure while handling Hasura Auth webhook");
                return [2];
            case 10: return [2];
        }
    });
}); });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzdXJhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2h0dHAtcm91dGVycy9oYXN1cmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBbUM7QUFFbkMsb0RBQThCO0FBQzlCLDhEQUErQjtBQUMvQixzREFBK0I7QUFDL0IsMERBQStCO0FBQy9CLCtDQUEyQztBQUMzQyxrREFBNEQ7QUFFL0MsUUFBQSxNQUFNLEdBQUcsaUJBQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQU92QyxJQUFJLFdBQStCLENBQUM7QUFDcEMsSUFBSSxhQUEyQixDQUFDO0FBQ2hDLFNBQWUsZUFBZTs7Ozs7O3lCQUl0QixDQUFDLGFBQWEsRUFBZCxjQUFjO29CQUNHLFdBQU0sb0JBQUssQ0FBQyxhQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLHNDQUFtQyxDQUFDLEVBQUE7O29CQUFsRyxRQUFRLEdBQUcsU0FBdUY7b0JBQ3hGLFdBQU0sUUFBUSxDQUFDLElBQUksRUFBRSxFQUFBOztvQkFBckMsYUFBYSxHQUFHLFNBQXFCLENBQUM7OztvQkFHMUMsSUFBSSxhQUFhLElBQUksQ0FBQyxXQUFXLEVBQUU7d0JBQy9CLFdBQVcsR0FBRyxrQkFBTyxDQUFDOzRCQUNsQixLQUFLLEVBQUUsSUFBSTs0QkFDWCxTQUFTLEVBQUUsSUFBSTs0QkFDZixxQkFBcUIsRUFBRSxDQUFDOzRCQUN4QixPQUFPLEVBQUUsYUFBYSxDQUFDLFFBQVE7eUJBQ2xDLENBQUMsQ0FBQztxQkFDTjtvQkFFRCxXQUFPOzRCQUNILFVBQVUsRUFBRSxXQUFXOzRCQUN2QixZQUFZLEVBQUUsYUFBYTt5QkFDOUIsRUFBQzs7OztDQUNMO0FBTUQsY0FBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsa0JBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBUSxF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