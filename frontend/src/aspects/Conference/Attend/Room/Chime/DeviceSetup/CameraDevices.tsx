import { Box, chakra } from "@chakra-ui/react";
import React from "react";
import { CameraSelection } from "./CameraSelection";
import PreviewVideo from "./PreviewVideo";

export const CameraDevices = chakra(CameraDevicesInner);

function CameraDevicesInner({ className }: { className?: string }): JSX.Element {
    return (
        <Box className={className}>
            <CameraSelection mb={4} />
            <PreviewVideo />
        </Box>
    );
}
