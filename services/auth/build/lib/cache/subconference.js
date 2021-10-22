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
exports.invalidateCachedSubconference = exports.getSubconference = void 0;
var core_1 = require("@urql/core");
var graphql_1 = require("../../generated/graphql");
var graphqlClient_1 = require("../../graphqlClient");
var cache_1 = require("./cache");
core_1.gql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    query GetSubconference($id: uuid!) {\n        conference_Subconference_by_pk(id: $id) {\n            id\n            conferenceVisibilityLevel\n        }\n    }\n"], ["\n    query GetSubconference($id: uuid!) {\n        conference_Subconference_by_pk(id: $id) {\n            id\n            conferenceVisibilityLevel\n        }\n    }\n"])));
var SubconferenceCache = new cache_1.Cache("auth.caches:Subconference", function (conferenceId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4, (graphqlClient_1.gqlClient === null || graphqlClient_1.gqlClient === void 0 ? void 0 : graphqlClient_1.gqlClient.query(graphql_1.GetSubconferenceDocument, {
                    id: conferenceId,
                }).toPromise())];
            case 1:
                response = _b.sent();
                data = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.conference_Subconference_by_pk;
                if (data) {
                    return [2, {
                            id: data.id,
                            conferenceVisibilityLevel: data.conferenceVisibilityLevel,
                        }];
                }
                return [2, undefined];
        }
    });
}); }, JSON.stringify, JSON.parse, 7 * 24 * 60 * 60 * 1000, 5 * 60 * 1000);
function getSubconference(subconferenceId, refetchNow) {
    if (refetchNow === void 0) { refetchNow = false; }
    return __awaiter(this, void 0, void 0, function () {
        var info;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, SubconferenceCache.get(subconferenceId, refetchNow)];
                case 1:
                    info = _a.sent();
                    if (!info && !refetchNow) {
                        return [2, getSubconference(subconferenceId, true)];
                    }
                    return [2, info];
            }
        });
    });
}
exports.getSubconference = getSubconference;
function invalidateCachedSubconference(subconferenceId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, SubconferenceCache.delete(subconferenceId)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.invalidateCachedSubconference = invalidateCachedSubconference;
var templateObject_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViY29uZmVyZW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY2FjaGUvc3ViY29uZmVyZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQWlDO0FBTWpDLG1EQUFtRTtBQUNuRSxxREFBZ0Q7QUFDaEQsaUNBQWdDO0FBRWhDLFVBQUcsNk9BQUEsMEtBT0YsS0FBQztBQU9GLElBQU0sa0JBQWtCLEdBQUcsSUFBSSxhQUFLLENBQ2hDLDJCQUEyQixFQUMzQixVQUFPLFlBQVk7Ozs7O29CQUNFLFdBQU0sQ0FBQSx5QkFBUyxhQUFULHlCQUFTLHVCQUFULHlCQUFTLENBQzFCLEtBQUssQ0FBd0Qsa0NBQXdCLEVBQUU7b0JBQ3JGLEVBQUUsRUFBRSxZQUFZO2lCQUNuQixFQUNBLFNBQVMsRUFBRSxDQUFBLEVBQUE7O2dCQUpWLFFBQVEsR0FBRyxTQUlEO2dCQUVWLElBQUksR0FBRyxNQUFBLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRSxJQUFJLDBDQUFFLDhCQUE4QixDQUFDO2dCQUM1RCxJQUFJLElBQUksRUFBRTtvQkFFTixXQUFPOzRCQUNILEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTs0QkFDWCx5QkFBeUIsRUFBRSxJQUFJLENBQUMseUJBQXlCO3lCQUM1RCxFQUFDO2lCQUNMO2dCQUNELFdBQU8sU0FBUyxFQUFDOzs7S0FDcEIsRUFDRCxJQUFJLENBQUMsU0FBUyxFQUNkLElBQUksQ0FBQyxLQUFLLEVBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksRUFDdkIsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQ2hCLENBQUM7QUFFRixTQUFzQixnQkFBZ0IsQ0FDbEMsZUFBdUIsRUFDdkIsVUFBa0I7SUFBbEIsMkJBQUEsRUFBQSxrQkFBa0I7Ozs7O3dCQUVMLFdBQU0sa0JBQWtCLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsRUFBQTs7b0JBQWhFLElBQUksR0FBRyxTQUF5RDtvQkFDdEUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTt3QkFDdEIsV0FBTyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUM7cUJBQ2xEO29CQUNELFdBQU8sSUFBSSxFQUFDOzs7O0NBQ2Y7QUFURCw0Q0FTQztBQUVELFNBQXNCLDZCQUE2QixDQUFDLGVBQXVCOzs7O3dCQUN2RSxXQUFNLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBQTs7b0JBQWhELFNBQWdELENBQUM7Ozs7O0NBQ3BEO0FBRkQsc0VBRUMifQ==