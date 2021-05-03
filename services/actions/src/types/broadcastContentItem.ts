type BroadcastElementInput = PendingCreation | MP4Input | VonageInput;

interface PendingCreation {
    type: "PendingCreation";
}

interface MP4Input {
    type: "MP4Input";
    durationSeconds?: number;
    s3Url: string;
}

interface VonageInput {
    type: "VonageInput";
    sessionId: string;
}
