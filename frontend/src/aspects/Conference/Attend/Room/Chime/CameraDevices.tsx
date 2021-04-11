import { Box, chakra } from "@chakra-ui/react";
import { CameraSelection, PreviewVideo, QualitySelection } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React from "react";

export const CameraDevices = chakra(CameraDevicesInner);

function CameraDevicesInner({ className }: { className?: string }): JSX.Element {
    return (
        <Box className={className}>
            <CameraSelection />
            <QualitySelection />
            <PreviewVideo />
        </Box>
    );
}
