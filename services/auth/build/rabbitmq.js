"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.downlink = exports.uplink = void 0;
var amqplib = __importStar(require("amqplib"));
var url = process.env.CLOUDAMQP_URL ||
    "amqp://" + (process.env.RABBITMQ_USERNAME
        ? "" + encodeURIComponent(process.env.RABBITMQ_USERNAME) + (process.env.RABBITMQ_PASSWORD ? ":" + encodeURIComponent(process.env.RABBITMQ_PASSWORD) : "") + "@"
        : "") + "localhost:5672";
var _uplink;
function uplink() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!_uplink) return [3, 2];
                    return [4, amqplib.connect(url)];
                case 1:
                    _uplink = _a.sent();
                    _a.label = 2;
                case 2: return [2, _uplink];
            }
        });
    });
}
exports.uplink = uplink;
var _downlink;
function downlink() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!_downlink) return [3, 2];
                    return [4, amqplib.connect(url)];
                case 1:
                    _downlink = _a.sent();
                    _a.label = 2;
                case 2: return [2, _downlink];
            }
        });
    });
}
exports.downlink = downlink;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFiYml0bXEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmFiYml0bXEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFtQztBQUVuQyxJQUFNLEdBQUcsR0FDTCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWE7SUFDekIsYUFDSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQjtRQUN6QixDQUFDLENBQUMsS0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE1BQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQzdGO1FBQ0wsQ0FBQyxDQUFDLEVBQUUsb0JBQ0ksQ0FBQztBQUVyQixJQUFJLE9BQXVDLENBQUM7QUFDNUMsU0FBc0IsTUFBTTs7Ozs7eUJBQ3BCLENBQUMsT0FBTyxFQUFSLGNBQVE7b0JBQ0UsV0FBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFBOztvQkFBcEMsT0FBTyxHQUFHLFNBQTBCLENBQUM7O3dCQUV6QyxXQUFPLE9BQU8sRUFBQzs7OztDQUNsQjtBQUxELHdCQUtDO0FBRUQsSUFBSSxTQUF5QyxDQUFDO0FBQzlDLFNBQXNCLFFBQVE7Ozs7O3lCQUN0QixDQUFDLFNBQVMsRUFBVixjQUFVO29CQUNFLFdBQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBQTs7b0JBQXRDLFNBQVMsR0FBRyxTQUEwQixDQUFDOzt3QkFFM0MsV0FBTyxTQUFTLEVBQUM7Ozs7Q0FDcEI7QUFMRCw0QkFLQyJ9