type BroadcastContentItemInput = MP4Input | VonageInput;

interface MP4Input {
    type: "MP4Input";
    s3Url: string;
}

interface VonageInput {
    type: "VonageInput";
}
