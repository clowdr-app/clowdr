export interface ChimeRegistrantJoinedDetail {
    version: string;
    eventType: "chime:RegistrantJoined";
    timestamp: number;
    meetingId: string;
    registrantId: string;
    externalUserId: string;
    networkType: string;
}

export interface ChimeRegistrantLeftDetail {
    version: string;
    eventType: "chime:RegistrantLeft";
    timestamp: number;
    meetingId: string;
    registrantId: string;
    externalUserId: string;
    networkType: string;
}

export interface ChimeMeetingEndedDetail {
    version: string;
    eventType: "chime:MeetingEnded";
    timestamp: number;
    meetingId: string;
    externalMeetingId: string;
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
