import { Box, chakra } from "@chakra-ui/react";
import { useLocalVideo } from "amazon-chime-sdk-component-library-react";
import React from "react";
import PreviewVideo from "./PreviewVideo";

export const CameraDevices = chakra(CameraDevicesInner);

function CameraDevicesInner({ className }: { className?: string }): JSX.Element {
    const { isVideoEnabled } = useLocalVideo();
    return <Box className={className}>{isVideoEnabled ? <PreviewVideo /> : undefined}</Box>;
}
