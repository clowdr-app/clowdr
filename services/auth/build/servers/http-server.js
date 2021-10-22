"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = void 0;
var assert_1 = __importDefault(require("assert"));
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var path_1 = __importDefault(require("path"));
var hasura_1 = require("../http-routers/hasura");
assert_1.default(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert_1.default(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert_1.default(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");
var PORT = process.env.PORT || 3002;
var server = express_1.default();
server.use(cors_1.default({
    origin: process.env.CORS_ORIGIN.split(","),
}));
server.use("/hasura", hasura_1.router);
var INDEX_FILE = "../resources/index.html";
server.use(function (_req, res) { return res.sendFile(path_1.default.resolve(path_1.default.join(__dirname, INDEX_FILE))); });
exports.httpServer = server.listen(PORT, function () { return console.log("Listening on " + PORT); });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC1zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmVycy9odHRwLXNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrREFBNEI7QUFDNUIsOENBQXdCO0FBQ3hCLG9EQUE4QjtBQUM5Qiw4Q0FBd0I7QUFDeEIsaURBQWdFO0FBRWhFLGdCQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztBQUNoRSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztBQUM3RSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLG1DQUFtQyxDQUFDLENBQUM7QUFFckUsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBQ3RDLElBQU0sTUFBTSxHQUFHLGlCQUFPLEVBQUUsQ0FBQztBQUN6QixNQUFNLENBQUMsR0FBRyxDQUNOLGNBQUksQ0FBQztJQUNELE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0NBQzdDLENBQUMsQ0FDTCxDQUFDO0FBRUYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsZUFBWSxDQUFDLENBQUM7QUFFcEMsSUFBTSxVQUFVLEdBQUcseUJBQXlCLENBQUM7QUFDN0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBRSxHQUFHLElBQUssT0FBQSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUE1RCxDQUE0RCxDQUFDLENBQUM7QUFFM0UsUUFBQSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBTSxPQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWdCLElBQU0sQ0FBQyxFQUFuQyxDQUFtQyxDQUFDLENBQUMifQ==