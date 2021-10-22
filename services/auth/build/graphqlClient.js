"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gqlClient = void 0;
var core_1 = require("@urql/core");
var exchange_retry_1 = require("@urql/exchange-retry");
var node_fetch_1 = __importDefault(require("node-fetch"));
if (process.env.GRAPHQL_API_DOMAIN && process.env.HASURA_ADMIN_SECRET) {
    var useSecureProtocols = process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false";
    var httpProtocol = useSecureProtocols ? "https" : "http";
    exports.gqlClient = core_1.createClient({
        url: httpProtocol + "://" + process.env.GRAPHQL_API_DOMAIN + "/v1/graphql",
        fetch: node_fetch_1.default,
        fetchOptions: {
            headers: {
                "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
            },
        },
        requestPolicy: "network-only",
        exchanges: [
            core_1.dedupExchange,
            exchange_retry_1.retryExchange({
                initialDelayMs: 500,
                maxDelayMs: 5000,
                randomDelay: true,
                maxNumberAttempts: 3,
                retryIf: function (err, _op) { return !!err && !!err.networkError; },
            }),
            core_1.fetchExchange,
        ],
    });
    core_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        query EmptyQuery {\n            conference_Conference {\n                id\n            }\n        }\n    "], ["\n        query EmptyQuery {\n            conference_Conference {\n                id\n            }\n        }\n    "])));
}
else {
    console.warn("Skipping GraphQL Client initialisation as GraphQL/Hasura env vars not provided.");
}
var templateObject_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGhxbENsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9ncmFwaHFsQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQSxtQ0FBNkU7QUFDN0UsdURBQXFEO0FBQ3JELDBEQUErQjtBQUkvQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRTtJQUNuRSxJQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEtBQUssT0FBTyxDQUFDO0lBQ2hGLElBQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUUzRCxpQkFBUyxHQUFHLG1CQUFZLENBQUM7UUFDckIsR0FBRyxFQUFLLFlBQVksV0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixnQkFBYTtRQUNyRSxLQUFLLEVBQUUsb0JBQVk7UUFDbkIsWUFBWSxFQUFFO1lBQ1YsT0FBTyxFQUFFO2dCQUNMLHVCQUF1QixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO2FBQzNEO1NBQ0o7UUFHRCxhQUFhLEVBQUUsY0FBYztRQUM3QixTQUFTLEVBQUU7WUFDUCxvQkFBYTtZQUNiLDhCQUFhLENBQUM7Z0JBQ1YsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixXQUFXLEVBQUUsSUFBSTtnQkFDakIsaUJBQWlCLEVBQUUsQ0FBQztnQkFHcEIsT0FBTyxFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSyxPQUFBLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQTNCLENBQTJCO2FBQ3JELENBQUM7WUFDRixvQkFBYTtTQUNoQjtLQUNKLENBQUMsQ0FBQztJQUdILFVBQUcsMExBQUEsdUhBTUYsS0FBQztDQUNMO0tBQU07SUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLGlGQUFpRixDQUFDLENBQUM7Q0FDbkcifQ==