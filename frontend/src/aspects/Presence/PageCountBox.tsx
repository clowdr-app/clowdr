import { Box, chakra, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMaybeConference } from "../Conference/useConference";
import FAIcon from "../Icons/FAIcon";
import { usePresenceState } from "./PresenceStateProvider";

export default function PageCountBox(): JSX.Element {
    const presence = usePresenceState();
    const [pageCount, setPageCount] = useState<number | null>(null);
    const mConference = useMaybeConference();
    const location = useLocation();

    useEffect(() => {
        return presence.observePage(location.pathname, mConference?.slug, (ids) => {
            setPageCount(ids.size);
        });
    }, [location.pathname, mConference?.slug, presence]);

    const pageCountLabel = pageCount
        ? `${pageCount} user${pageCount !== 1 ? "s" : ""} with an open tab here`
        : undefined;

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
