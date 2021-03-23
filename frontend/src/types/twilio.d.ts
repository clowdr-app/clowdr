declare namespace Twilio {
    declare namespace Chat {
        declare type Client = Record<string, any>;
        declare const Client: any;
    }
}

type Channel = Record<string, any>;
declare namespace TwilioMessage {
    declare type UpdateReason = "attributes" | string;
}
type TwilioMessage = Record<string, any>;
