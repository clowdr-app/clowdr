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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAuthWebhook = void 0;
var graphql_1 = require("../generated/graphql");
var conference_1 = require("../lib/cache/conference");
var conferenceRoom_1 = require("../lib/cache/conferenceRoom");
var registrant_1 = require("../lib/cache/registrant");
var room_1 = require("../lib/cache/room");
var roomMembership_1 = require("../lib/cache/roomMembership");
var subconference_1 = require("../lib/cache/subconference");
var subconferenceRoom_1 = require("../lib/cache/subconferenceRoom");
var user_1 = require("../lib/cache/user");
var HasuraHeaders;
(function (HasuraHeaders) {
    HasuraHeaders["Role"] = "x-hasura-role";
    HasuraHeaders["UserId"] = "x-hasura-user-id";
    HasuraHeaders["RegistrantIds"] = "x-hasura-registrant-ids";
    HasuraHeaders["ConferenceIds"] = "x-hasura-conference-ids";
    HasuraHeaders["SubconferenceIds"] = "x-hasura-subconference-ids";
    HasuraHeaders["RoomIds"] = "x-hasura-room-ids";
    HasuraHeaders["MagicToken"] = "x-hasura-magic-token";
    HasuraHeaders["InviteCode"] = "x-hasura-invite-code";
})(HasuraHeaders || (HasuraHeaders = {}));
var HasuraRoleNames;
(function (HasuraRoleNames) {
    HasuraRoleNames["User"] = "user";
    HasuraRoleNames["Unauthenticated"] = "unauthenticated";
    HasuraRoleNames["MainConferenceOrganizer"] = "main-conference-organizer";
    HasuraRoleNames["Organizer"] = "organizer";
    HasuraRoleNames["Moderator"] = "moderator";
    HasuraRoleNames["Attendee"] = "attendee";
    HasuraRoleNames["Submitter"] = "submitter";
    HasuraRoleNames["RoomAdmin"] = "room-admin";
    HasuraRoleNames["RoomMember"] = "room-member";
})(HasuraRoleNames || (HasuraRoleNames = {}));
function formatArrayForHasuraHeader(values) {
    if (typeof values === "string") {
        return "{\"" + values + "\"}";
    }
    else {
        return "{" + values.map(function (x) { return "\"" + x + "\""; }).join(",") + "}";
    }
}
function handleAuthWebhook(_rawPayload, verifiedParams, unverifiedParams) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var result, conference, subconference, publicSubconferenceIds, _b, _c, subconferenceId, subconference, e_1_1, result, allowedRoles, requestedRole, user, registrantId, registrant, conference, availableSubconferenceIds, _d, _e, subconferenceId, subconference, e_2_1, _f, _g, subconferenceId, subconference, e_3_1, room, role, allRooms, availableSubconferenceIds_1, availableSubconferenceIds_1_1, subconferenceId, allSubconfRooms, roomId, roomManagementMode, e_4_1, availableRoomIds, roomId, roomManagementMode, availableRoomIds, _h, _j, _i, roomId, roomManagementMode, roomMembership, subconferenceMembership, room, role, allRooms, availableRoomIds, roomId, roomManagementMode, availableRoomIds, _k, _l, _m, roomId, roomManagementMode, roomMembership;
        var _o, _p, _q, e_1, _r, e_2, _s, e_3, _t, e_4, _u;
        return __generator(this, function (_v) {
            switch (_v.label) {
                case 0:
                    console.log("Auth webhook inputs", { _rawPayload: _rawPayload, verifiedParams: verifiedParams, unverifiedParams: unverifiedParams });
                    if (unverifiedParams.magicToken) {
                        return [2, (_o = {},
                                _o[HasuraHeaders.Role] = HasuraRoleNames.Submitter,
                                _o[HasuraHeaders.MagicToken] = unverifiedParams.magicToken,
                                _o)];
                    }
                    if (unverifiedParams.inviteCode) {
                        return [2, (_p = {},
                                _p[HasuraHeaders.Role] = HasuraRoleNames.Unauthenticated,
                                _p[HasuraHeaders.InviteCode] = unverifiedParams.inviteCode,
                                _p)];
                    }
                    if (!!verifiedParams.userId) return [3, 13];
                    result = (_q = {},
                        _q[HasuraHeaders.Role] = HasuraRoleNames.Unauthenticated,
                        _q);
                    if (!unverifiedParams.conferenceId) return [3, 12];
                    return [4, conference_1.getConference(unverifiedParams.conferenceId)];
                case 1:
                    conference = _v.sent();
                    if (!conference) return [3, 12];
                    if (!(conference.conferenceVisibilityLevel === graphql_1.Conference_VisibilityLevel_Enum.Public)) return [3, 12];
                    result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);
                    if (!unverifiedParams.subconferenceId) return [3, 3];
                    return [4, subconference_1.getSubconference(unverifiedParams.subconferenceId)];
                case 2:
                    subconference = _v.sent();
                    if ((subconference === null || subconference === void 0 ? void 0 : subconference.conferenceVisibilityLevel) === graphql_1.Conference_VisibilityLevel_Enum.Public) {
                        result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(subconference.id);
                    }
                    return [3, 12];
                case 3:
                    publicSubconferenceIds = [];
                    _v.label = 4;
                case 4:
                    _v.trys.push([4, 9, 10, 11]);
                    _b = __values(conference.subconferenceIds), _c = _b.next();
                    _v.label = 5;
                case 5:
                    if (!!_c.done) return [3, 8];
                    subconferenceId = _c.value;
                    return [4, subconference_1.getSubconference(subconferenceId)];
                case 6:
                    subconference = _v.sent();
                    if ((subconference === null || subconference === void 0 ? void 0 : subconference.conferenceVisibilityLevel) === graphql_1.Conference_VisibilityLevel_Enum.Public) {
                        publicSubconferenceIds.push(subconference.id);
                    }
                    _v.label = 7;
                case 7:
                    _c = _b.next();
                    return [3, 5];
                case 8: return [3, 11];
                case 9:
                    e_1_1 = _v.sent();
                    e_1 = { error: e_1_1 };
                    return [3, 11];
                case 10:
                    try {
                        if (_c && !_c.done && (_r = _b.return)) _r.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7];
                case 11:
                    result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(publicSubconferenceIds);
                    _v.label = 12;
                case 12: return [2, result];
                case 13:
                    result = {};
                    allowedRoles = [];
                    requestedRole = ((_a = unverifiedParams.role) !== null && _a !== void 0 ? _a : HasuraRoleNames.User);
                    return [4, user_1.getUser(verifiedParams.userId)];
                case 14:
                    user = _v.sent();
                    if (!user) return [3, 94];
                    result[HasuraHeaders.UserId] = user.id;
                    allowedRoles.push(HasuraRoleNames.User);
                    if (!unverifiedParams.conferenceId) return [3, 93];
                    registrantId = user.registrantIds.find(function (x) { return x.conferenceId === unverifiedParams.conferenceId; });
                    if (!registrantId) return [3, 91];
                    return [4, registrant_1.getRegistrant(registrantId.id)];
                case 15:
                    registrant = _v.sent();
                    return [4, conference_1.getConference(unverifiedParams.conferenceId)];
                case 16:
                    conference = _v.sent();
                    if (!(registrant && conference)) return [3, 89];
                    result[HasuraHeaders.RegistrantIds] = formatArrayForHasuraHeader(registrant.id);
                    result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);
                    if (!!unverifiedParams.subconferenceId) return [3, 64];
                    allowedRoles.push(HasuraRoleNames.Attendee);
                    availableSubconferenceIds = [];
                    if (!(registrant.conferenceRole === graphql_1.Registrant_RegistrantRole_Enum.Moderator)) return [3, 25];
                    allowedRoles.push(HasuraRoleNames.Moderator);
                    _v.label = 17;
                case 17:
                    _v.trys.push([17, 22, 23, 24]);
                    _d = __values(conference.subconferenceIds), _e = _d.next();
                    _v.label = 18;
                case 18:
                    if (!!_e.done) return [3, 21];
                    subconferenceId = _e.value;
                    return [4, subconference_1.getSubconference(subconferenceId)];
                case 19:
                    subconference = _v.sent();
                    if ((subconference === null || subconference === void 0 ? void 0 : subconference.conferenceVisibilityLevel) ===
                        graphql_1.Conference_VisibilityLevel_Enum.Public ||
                        (subconference === null || subconference === void 0 ? void 0 : subconference.conferenceVisibilityLevel) ===
                            graphql_1.Conference_VisibilityLevel_Enum.External) {
                        availableSubconferenceIds.push(subconference.id);
                    }
                    _v.label = 20;
                case 20:
                    _e = _d.next();
                    return [3, 18];
                case 21: return [3, 24];
                case 22:
                    e_2_1 = _v.sent();
                    e_2 = { error: e_2_1 };
                    return [3, 24];
                case 23:
                    try {
                        if (_e && !_e.done && (_s = _d.return)) _s.call(_d);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7];
                case 24: return [3, 33];
                case 25:
                    if (!(registrant.conferenceRole === graphql_1.Registrant_RegistrantRole_Enum.Organizer)) return [3, 26];
                    allowedRoles.push(HasuraRoleNames.Moderator);
                    allowedRoles.push(HasuraRoleNames.Organizer);
                    allowedRoles.push(HasuraRoleNames.MainConferenceOrganizer);
                    availableSubconferenceIds = conference.subconferenceIds;
                    return [3, 33];
                case 26:
                    _v.trys.push([26, 31, 32, 33]);
                    _f = __values(conference.subconferenceIds), _g = _f.next();
                    _v.label = 27;
                case 27:
                    if (!!_g.done) return [3, 30];
                    subconferenceId = _g.value;
                    return [4, subconference_1.getSubconference(subconferenceId)];
                case 28:
                    subconference = _v.sent();
                    if ((subconference === null || subconference === void 0 ? void 0 : subconference.conferenceVisibilityLevel) ===
                        graphql_1.Conference_VisibilityLevel_Enum.Public ||
                        (subconference === null || subconference === void 0 ? void 0 : subconference.conferenceVisibilityLevel) ===
                            graphql_1.Conference_VisibilityLevel_Enum.External) {
                        availableSubconferenceIds.push(subconference.id);
                    }
                    _v.label = 29;
                case 29:
                    _g = _f.next();
                    return [3, 27];
                case 30: return [3, 33];
                case 31:
                    e_3_1 = _v.sent();
                    e_3 = { error: e_3_1 };
                    return [3, 33];
                case 32:
                    try {
                        if (_g && !_g.done && (_t = _f.return)) _t.call(_f);
                    }
                    finally { if (e_3) throw e_3.error; }
                    return [7];
                case 33:
                    result[HasuraHeaders.SubconferenceIds] =
                        formatArrayForHasuraHeader(availableSubconferenceIds);
                    if (!unverifiedParams.roomId) return [3, 43];
                    return [4, room_1.getRoom(unverifiedParams.roomId)];
                case 34:
                    room = _v.sent();
                    if (!room) return [3, 41];
                    if (!(room.conferenceId === conference.id && !room.subconferenceId)) return [3, 39];
                    if (!(allowedRoles.includes(HasuraRoleNames.Moderator) ||
                        allowedRoles.includes(HasuraRoleNames.Organizer) ||
                        allowedRoles.includes(HasuraRoleNames.MainConferenceOrganizer))) return [3, 35];
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                    allowedRoles.push(HasuraRoleNames.RoomAdmin);
                    allowedRoles.push(HasuraRoleNames.RoomMember);
                    return [3, 38];
                case 35:
                    if (!(room.managementModeName === graphql_1.Room_ManagementMode_Enum.Public)) return [3, 36];
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                    allowedRoles.push(HasuraRoleNames.RoomMember);
                    return [3, 38];
                case 36: return [4, roomMembership_1.RoomMembershipCache.getField(room.id, registrant.id)];
                case 37:
                    role = _v.sent();
                    if (role) {
                        result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                        allowedRoles.push(HasuraRoleNames.RoomMember);
                        if (role === graphql_1.Room_PersonRole_Enum.Admin) {
                            allowedRoles.push(HasuraRoleNames.RoomAdmin);
                        }
                    }
                    else {
                        return [2, false];
                    }
                    _v.label = 38;
                case 38: return [3, 40];
                case 39: return [2, false];
                case 40: return [3, 42];
                case 41: return [2, false];
                case 42: return [3, 63];
                case 43:
                    if (!unverifiedParams.includeRoomIds) return [3, 62];
                    allowedRoles.push(HasuraRoleNames.RoomMember);
                    return [4, conferenceRoom_1.ConferenceRoomCache.get(conference.id)];
                case 44:
                    allRooms = _v.sent();
                    if (!allRooms) return [3, 60];
                    _v.label = 45;
                case 45:
                    _v.trys.push([45, 50, 51, 52]);
                    availableSubconferenceIds_1 = __values(availableSubconferenceIds), availableSubconferenceIds_1_1 = availableSubconferenceIds_1.next();
                    _v.label = 46;
                case 46:
                    if (!!availableSubconferenceIds_1_1.done) return [3, 49];
                    subconferenceId = availableSubconferenceIds_1_1.value;
                    return [4, subconferenceRoom_1.SubconferenceRoomCache.get(subconferenceId)];
                case 47:
                    allSubconfRooms = _v.sent();
                    for (roomId in allSubconfRooms) {
                        roomManagementMode = allSubconfRooms[roomId];
                        allRooms[roomId] = roomManagementMode;
                    }
                    _v.label = 48;
                case 48:
                    availableSubconferenceIds_1_1 = availableSubconferenceIds_1.next();
                    return [3, 46];
                case 49: return [3, 52];
                case 50:
                    e_4_1 = _v.sent();
                    e_4 = { error: e_4_1 };
                    return [3, 52];
                case 51:
                    try {
                        if (availableSubconferenceIds_1_1 && !availableSubconferenceIds_1_1.done && (_u = availableSubconferenceIds_1.return)) _u.call(availableSubconferenceIds_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                    return [7];
                case 52:
                    if (!(requestedRole === HasuraRoleNames.Organizer)) return [3, 53];
                    if (allowedRoles.includes(requestedRole)) {
                        availableRoomIds = [];
                        for (roomId in allRooms) {
                            roomManagementMode = allRooms[roomId];
                            if (roomManagementMode === graphql_1.Room_ManagementMode_Enum.Public ||
                                roomManagementMode === graphql_1.Room_ManagementMode_Enum.Private) {
                                availableRoomIds.push(roomId);
                            }
                        }
                        result[HasuraHeaders.RoomIds] =
                            formatArrayForHasuraHeader(availableRoomIds);
                    }
                    else {
                        return [2, false];
                    }
                    return [3, 59];
                case 53:
                    availableRoomIds = [];
                    _h = [];
                    for (_j in allRooms)
                        _h.push(_j);
                    _i = 0;
                    _v.label = 54;
                case 54:
                    if (!(_i < _h.length)) return [3, 58];
                    roomId = _h[_i];
                    roomManagementMode = allRooms[roomId];
                    if (!(roomManagementMode === graphql_1.Room_ManagementMode_Enum.Public)) return [3, 55];
                    availableRoomIds.push(roomId);
                    return [3, 57];
                case 55:
                    if (!(roomManagementMode === graphql_1.Room_ManagementMode_Enum.Private ||
                        roomManagementMode === graphql_1.Room_ManagementMode_Enum.Managed ||
                        roomManagementMode === graphql_1.Room_ManagementMode_Enum.Dm)) return [3, 57];
                    return [4, roomMembership_1.RoomMembershipCache.getField(roomId, registrant.id)];
                case 56:
                    roomMembership = _v.sent();
                    if (roomMembership) {
                        availableRoomIds.push(roomId);
                    }
                    _v.label = 57;
                case 57:
                    _i++;
                    return [3, 54];
                case 58:
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(availableRoomIds);
                    _v.label = 59;
                case 59: return [3, 61];
                case 60: return [2, false];
                case 61: return [3, 63];
                case 62:
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader([]);
                    _v.label = 63;
                case 63: return [3, 88];
                case 64:
                    subconferenceMembership = registrant.subconferenceMemberships.find(function (x) { return x.subconferenceId === unverifiedParams.subconferenceId; });
                    if (!subconferenceMembership) return [3, 87];
                    result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(unverifiedParams.subconferenceId);
                    allowedRoles.push(HasuraRoleNames.Attendee);
                    if (subconferenceMembership.role === graphql_1.Registrant_RegistrantRole_Enum.Moderator) {
                        allowedRoles.push(HasuraRoleNames.Moderator);
                    }
                    else if (subconferenceMembership.role === graphql_1.Registrant_RegistrantRole_Enum.Organizer) {
                        allowedRoles.push(HasuraRoleNames.Moderator);
                        allowedRoles.push(HasuraRoleNames.Organizer);
                    }
                    if (!unverifiedParams.roomId) return [3, 74];
                    return [4, room_1.getRoom(unverifiedParams.roomId)];
                case 65:
                    room = _v.sent();
                    if (!room) return [3, 72];
                    if (!(room.conferenceId === conference.id &&
                        room.subconferenceId === subconferenceMembership.subconferenceId)) return [3, 70];
                    if (!(allowedRoles.includes(HasuraRoleNames.Moderator) ||
                        allowedRoles.includes(HasuraRoleNames.Organizer))) return [3, 66];
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                    allowedRoles.push(HasuraRoleNames.RoomAdmin);
                    allowedRoles.push(HasuraRoleNames.RoomMember);
                    return [3, 69];
                case 66:
                    if (!(room.managementModeName === graphql_1.Room_ManagementMode_Enum.Public)) return [3, 67];
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                    allowedRoles.push(HasuraRoleNames.RoomMember);
                    return [3, 69];
                case 67: return [4, roomMembership_1.RoomMembershipCache.getField(room.id, registrant.id)];
                case 68:
                    role = _v.sent();
                    if (role) {
                        result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                        allowedRoles.push(HasuraRoleNames.RoomMember);
                        if (role === graphql_1.Room_PersonRole_Enum.Admin) {
                            allowedRoles.push(HasuraRoleNames.RoomAdmin);
                        }
                    }
                    else {
                        return [2, false];
                    }
                    _v.label = 69;
                case 69: return [3, 71];
                case 70: return [2, false];
                case 71: return [3, 73];
                case 72: return [2, false];
                case 73: return [3, 86];
                case 74:
                    if (!unverifiedParams.includeRoomIds) return [3, 85];
                    allowedRoles.push(HasuraRoleNames.RoomMember);
                    return [4, subconferenceRoom_1.SubconferenceRoomCache.get(subconferenceMembership.subconferenceId)];
                case 75:
                    allRooms = _v.sent();
                    if (!allRooms) return [3, 83];
                    if (!(requestedRole === HasuraRoleNames.Organizer)) return [3, 76];
                    if (allowedRoles.includes(requestedRole)) {
                        availableRoomIds = [];
                        for (roomId in allRooms) {
                            roomManagementMode = allRooms[roomId];
                            if (roomManagementMode === graphql_1.Room_ManagementMode_Enum.Public ||
                                roomManagementMode === graphql_1.Room_ManagementMode_Enum.Private) {
                                availableRoomIds.push(roomId);
                            }
                        }
                        result[HasuraHeaders.RoomIds] =
                            formatArrayForHasuraHeader(availableRoomIds);
                    }
                    else {
                        return [2, false];
                    }
                    return [3, 82];
                case 76:
                    availableRoomIds = [];
                    _k = [];
                    for (_l in allRooms)
                        _k.push(_l);
                    _m = 0;
                    _v.label = 77;
                case 77:
                    if (!(_m < _k.length)) return [3, 81];
                    roomId = _k[_m];
                    roomManagementMode = allRooms[roomId];
                    if (!(roomManagementMode === graphql_1.Room_ManagementMode_Enum.Public)) return [3, 78];
                    availableRoomIds.push(roomId);
                    return [3, 80];
                case 78:
                    if (!(roomManagementMode === graphql_1.Room_ManagementMode_Enum.Private ||
                        roomManagementMode === graphql_1.Room_ManagementMode_Enum.Managed ||
                        roomManagementMode === graphql_1.Room_ManagementMode_Enum.Dm)) return [3, 80];
                    return [4, roomMembership_1.RoomMembershipCache.getField(roomId, registrant.id)];
                case 79:
                    roomMembership = _v.sent();
                    if (roomMembership) {
                        availableRoomIds.push(roomId);
                    }
                    _v.label = 80;
                case 80:
                    _m++;
                    return [3, 77];
                case 81:
                    result[HasuraHeaders.RoomIds] =
                        formatArrayForHasuraHeader(availableRoomIds);
                    _v.label = 82;
                case 82: return [3, 84];
                case 83: return [2, false];
                case 84: return [3, 86];
                case 85:
                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader([]);
                    _v.label = 86;
                case 86: return [3, 88];
                case 87: return [2, false];
                case 88: return [3, 90];
                case 89: return [2, false];
                case 90: return [3, 92];
                case 91: return [2, false];
                case 92: return [3, 94];
                case 93:
                    result[HasuraHeaders.RegistrantIds] = formatArrayForHasuraHeader(user.registrantIds.map(function (x) { return x.id; }));
                    _v.label = 94;
                case 94:
                    if (allowedRoles.includes(requestedRole)) {
                        result[HasuraHeaders.Role] = requestedRole;
                    }
                    else {
                        return [2, false];
                    }
                    return [2, result];
            }
        });
    });
}
exports.handleAuthWebhook = handleAuthWebhook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzdXJhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2h0dHAtaGFuZGxlcnMvaGFzdXJhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBSzhCO0FBQzlCLHNEQUF3RDtBQUN4RCw4REFBa0U7QUFDbEUsc0RBQXdEO0FBQ3hELDBDQUE0QztBQUM1Qyw4REFBa0U7QUFDbEUsNERBQThEO0FBQzlELG9FQUF3RTtBQUN4RSwwQ0FBNEM7QUFFNUMsSUFBSyxhQVdKO0FBWEQsV0FBSyxhQUFhO0lBQ2QsdUNBQXNCLENBQUE7SUFFdEIsNENBQTJCLENBQUE7SUFDM0IsMERBQXlDLENBQUE7SUFDekMsMERBQXlDLENBQUE7SUFDekMsZ0VBQStDLENBQUE7SUFDL0MsOENBQTZCLENBQUE7SUFFN0Isb0RBQW1DLENBQUE7SUFDbkMsb0RBQW1DLENBQUE7QUFDdkMsQ0FBQyxFQVhJLGFBQWEsS0FBYixhQUFhLFFBV2pCO0FBRUQsSUFBSyxlQVVKO0FBVkQsV0FBSyxlQUFlO0lBQ2hCLGdDQUFhLENBQUE7SUFDYixzREFBbUMsQ0FBQTtJQUNuQyx3RUFBcUQsQ0FBQTtJQUNyRCwwQ0FBdUIsQ0FBQTtJQUN2QiwwQ0FBdUIsQ0FBQTtJQUN2Qix3Q0FBcUIsQ0FBQTtJQUNyQiwwQ0FBdUIsQ0FBQTtJQUN2QiwyQ0FBd0IsQ0FBQTtJQUN4Qiw2Q0FBMEIsQ0FBQTtBQUM5QixDQUFDLEVBVkksZUFBZSxLQUFmLGVBQWUsUUFVbkI7QUFFRCxTQUFTLDBCQUEwQixDQUFDLE1BQXlCO0lBQ3pELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1FBQzVCLE9BQU8sUUFBSyxNQUFNLFFBQUksQ0FBQztLQUMxQjtTQUFNO1FBQ0gsT0FBTyxNQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxPQUFJLENBQUMsT0FBRyxF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