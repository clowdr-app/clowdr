import { Box, chakra } from "@chakra-ui/react";
import { PreviewVideo } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React from "react";
import { CameraSelection } from "./CameraSelection";

export const CameraDevices = chakra(CameraDevicesInner);

function CameraDevicesInner({ className }: { className?: string }): JSX.Element {
    return (
        <Box className={className}>
            <CameraSelection mb={4} />
            <PreviewVideo />
        </Box>
    );
}
