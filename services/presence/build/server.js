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
var socketio_jwt_1 = require("@thream/socketio-jwt");
var assert_1 = __importDefault(require("assert"));
var crypto_1 = __importDefault(require("crypto"));
var express_1 = __importDefault(require("express"));
var jwks_rsa_1 = __importDefault(require("jwks-rsa"));
var socket_io_1 = __importDefault(require("socket.io"));
var socket_io_redis_1 = __importDefault(require("socket.io-redis"));
assert_1.default(process.env.REDIS_URL, "REDIS_URL env var not defined.");
assert_1.default(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert_1.default(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");
var PORT = process.env.PORT || 3002;
var jwksClient = jwks_rsa_1.default({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 1,
    jwksUri: "https://" + process.env.AUTH0_API_DOMAIN + "/.well-known/jwks.json",
});
var INDEX = "/resources/index.html";
var server = express_1.default()
    .use(function (_req, res) { return res.sendFile(INDEX, { root: __dirname }); })
    .listen(PORT, function () { return console.log("Listening on " + PORT); });
var io = new socket_io_1.default.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
});
io.adapter(socket_io_redis_1.default.createAdapter(process.env.REDIS_URL));
io.use(socketio_jwt_1.authorize({
    secret: function (token) { return __awaiter(void 0, void 0, void 0, function () {
        var key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(token && typeof token !== "string")) return [3, 2];
                    return [4, jwksClient.getSigningKeyAsync(token.header.kid)];
                case 1:
                    key = _a.sent();
                    return [2, key.getPublicKey()];
                case 2: return [2, ""];
            }
        });
    }); },
    algorithms: ["RS256"],
}));
function getPageKey(confSlug, path) {
    var hash = crypto_1.default.createHash("sha256");
    hash.write(confSlug);
    hash.write(path);
    return hash.digest("hex");
}
io.on("connection", function (socket) {
    var _this = this;
    var userId = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
    var conferenceSlug = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-conference-slug"];
    console.log("Authorized client connected:\n    User Id         : " + userId + "\n    Conference slug : " + conferenceSlug + "\n");
    socket.on("disconnect", function () { return console.log("Client disconnected"); });
    socket.on("enterPage", function (path) { return __awaiter(_this, void 0, void 0, function () {
        var pageKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pageKey = getPageKey(conferenceSlug, path);
                    return [4, socket.join(pageKey)];
                case 1:
                    _a.sent();
                    socket.to(pageKey).emit("present", {
                        utcMillis: Date.now(),
                        path: path,
                    });
                    return [2];
            }
        });
    }); });
    socket.on("leavePage", function (path) { return __awaiter(_this, void 0, void 0, function () {
        var pageKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pageKey = getPageKey(conferenceSlug, path);
                    return [4, socket.leave(pageKey)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    socket.on("observePage", function (path) { return __awaiter(_this, void 0, void 0, function () {
        var pageKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pageKey = getPageKey(conferenceSlug, path);
                    return [4, socket.join(pageKey)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    socket.on("unobservePage", function (path) { return __awaiter(_this, void 0, void 0, function () {
        var pageKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pageKey = getPageKey(conferenceSlug, path);
                    return [4, socket.leave(pageKey)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    socket.on("present", function (data) {
        console.log("Present: " + userId + " for " + data.path);
        var pageKey = getPageKey(conferenceSlug, data.path);
        socket.to(pageKey).emit("present", {
            utcMillis: data.utcMillis,
            path: data.path,
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFEQUFpRDtBQUNqRCxrREFBNEI7QUFDNUIsa0RBQTRCO0FBQzVCLG9EQUE4QjtBQUM5QixzREFBK0I7QUFDL0Isd0RBQTZDO0FBQzdDLG9FQUFvQztBQUVwQyxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7QUFDaEUsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLHNDQUFzQyxDQUFDLENBQUM7QUFDN0UsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDO0FBRXJFLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztBQUV0QyxJQUFNLFVBQVUsR0FBRyxrQkFBTyxDQUFDO0lBQ3ZCLEtBQUssRUFBRSxJQUFJO0lBQ1gsU0FBUyxFQUFFLElBQUk7SUFDZixxQkFBcUIsRUFBRSxDQUFDO0lBQ3hCLE9BQU8sRUFBRSxhQUFXLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLDJCQUF3QjtDQUMzRSxDQUFDLENBQUM7QUFFSCxJQUFNLEtBQUssR0FBRyx1QkFBdUIsQ0FBQztBQUN0QyxJQUFNLE1BQU0sR0FBRyxpQkFBTyxFQUFFO0tBQ25CLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBRSxHQUFHLElBQUssT0FBQSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUF4QyxDQUF3QyxDQUFDO0tBQzVELE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBTSxPQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JB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