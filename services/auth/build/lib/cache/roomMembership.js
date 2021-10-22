"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.RoomMembershipCache = void 0;
var core_1 = require("@urql/core");
var graphql_1 = require("../../generated/graphql");
var graphqlClient_1 = require("../../graphqlClient");
var hashsetCache_1 = require("./hashsetCache");
core_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    query GetRoomMemberships($roomId: uuid!) {\n        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {\n            id\n            registrantId\n            personRoleName\n        }\n    }\n"], ["\n    query GetRoomMemberships($roomId: uuid!) {\n        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {\n            id\n            registrantId\n            personRoleName\n        }\n    }\n"])));
exports.RoomMembershipCache = new hashsetCache_1.HashsetCache("auth.caches:RoomMembership", function (roomId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4, (graphqlClient_1.gqlClient === null || graphqlClient_1.gqlClient === void 0 ? void 0 : graphqlClient_1.gqlClient.query(graphql_1.GetRoomMembershipsDocument, {
                    roomId: roomId,
                }).toPromise())];
            case 1:
                response = _b.sent();
                data = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.room_RoomMembership;
                if (data) {
                    return [2, data.reduce(function (acc, x) {
                            acc[x.registrantId] = x.personRoleName;
                            return acc;
                        }, {})];
                }
                return [2, undefined];
        }
    });
}); }, 3 * 60 * 60 * 1000);
var templateObject_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbU1lbWJlcnNoaXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NhY2hlL3Jvb21NZW1iZXJzaGlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBaUM7QUFNakMsbURBQXFFO0FBQ3JFLHFEQUFnRDtBQUNoRCwrQ0FBOEM7QUFFOUMsVUFBRyxtUkFBQSxnTkFRRixLQUFDO0FBSVcsUUFBQSxtQkFBbUIsR0FBRyxJQUFJLDJCQUFZLENBQy9DLDRCQUE0QixFQUM1QixVQUFPLE1BQU07Ozs7O29CQUNRLFdBQU0sQ0FBQSx5QkFBUyxhQUFULHlCQUFTLHVCQUFULHlCQUFTLENBQzFCLEtBQUssQ0FBNEQsb0NBQTBCLEVBQUU7b0JBQzNGLE1BQU0sUUFBQTtpQkFDVCxFQUNBLFNBQVMsRUFBRSxDQUFBLEVBQUE7O2dCQUpWLFFBQVEsR0FBRyxTQUlEO2dCQUVWLElBQUksR0FBRyxNQUFBLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRSxJQUFJLDBDQUFFLG1CQUFtQixDQUFDO2dCQUNqRCxJQUFJLElBQUksRUFBRTtvQkFDTixXQUFPLElBQUksQ0FBQyxNQUFNLENBQXlCLFVBQUMsR0FBRyxFQUFFLENBQUM7NEJBQzlDLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQzs0QkFDdkMsT0FBTyxHQUFHLENBQUM7d0JBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDO2lCQUNWO2dCQUNELFdBQU8sU0FBUyxFQUFDOzs7S0FDcEIsRUFDRCxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQ3JCLENBQUMifQ==