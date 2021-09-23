import { Box } from "@chakra-ui/react";
import React from "react";

const CameraContainer = React.forwardRef<HTMLDivElement>(function CameraContainer(_props, ref) {
    return <Box ref={ref} width="100%" height="100%" top={0} left={0} pos="absolute" />;
});

export default CameraContainer;
