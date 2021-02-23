import { Box, chakra, Tooltip } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";
import { usePresenceCount } from "./PresenceCountProvider";

export default function PageCountBox(): JSX.Element {
    const { pageCount } = usePresenceCount();
    const pageCountLabel = pageCount ? `${pageCount} user${pageCount !== 1 ? "s" : ""} on this page now` : undefined;

    return pageCountLabel ? (
        <Box color="white" background="black" px={4} py={2} borderRadius={10}>
            <Tooltip label={pageCountLabel}>
                <chakra.span fontSize="1.2rem">
                    <FAIcon aria-label={pageCountLabel} iconStyle="s" icon="eye" verticalAlign="middle" />
                    <chakra.span verticalAlign="middle" ml={2} fontWeight="bold">
                        {pageCount}
                    </chakra.span>
                </chakra.span>
            </Tooltip>
        </Box>
    ) : (
        <></>
    );
}
