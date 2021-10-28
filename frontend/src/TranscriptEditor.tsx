import React from "react";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
}

export default (props: Props) => <textarea>{props.srtTranscript}</textarea>;
