export interface ChimeAttendeeJoinedDetail {
    version: string;
    eventType: "chime:AttendeeJoined";
    timestamp: number;
    meetingId: string;
    attendeeId: string;
    externalUserId: string;
    networkType: string;
}

export interface ChimeAttendeeLeftDetail {
    version: string;
    eventType: "chime:AttendeeLeft";
    timestamp: number;
    meetingId: string;
    attendeeId: string;
    externalUserId: string;
    networkType: string;
}

export interface ChimeEventBase {
    version: string;
    source: string;
    account: string;
    id: string;
    region: string;
    "detail-type": "Chime Meeting State Change";
    time: string;
    resources: string[];
    detail: any;
}
