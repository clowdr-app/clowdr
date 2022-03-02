export interface ChannelStackDetails {
    id: string;
    roomId: string;
    conferenceId: string;
    mediaLiveChannelId: string;
    mp4InputAttachmentName: string;
    rtmpAInputAttachmentName: string;
    rtmpBInputAttachmentName: string | null;
    rtmpRoomInput: {
        inputId: string;
        attachmentName: string;
    } | null;
    loopingMp4InputAttachmentName: string;
    fillerVideoKey: string | null;
}
