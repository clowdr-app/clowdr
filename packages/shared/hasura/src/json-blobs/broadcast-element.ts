export type BroadcastElementInput = PendingCreation | MP4Input | VonageInput;

export interface PendingCreation {
    type: "PendingCreation";
}

export interface MP4Input {
    type: "MP4Input";
    durationSeconds?: number;
    s3Url: string;
}

export interface VonageInput {
    type: "VonageInput";
    sessionId: string;
}
