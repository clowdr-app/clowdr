import type { TextProps } from "@chakra-ui/react";
import { Box, chakra, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import FAIcon from "../Chakra/FAIcon";
import { useMaybeConference } from "../Conference/useConference";
import { usePresenceState } from "./PresenceStateProvider";

export default function PageCountText({
    path,
    noIcon,
    noTooltip = false,
    noBrackets = false,
    ...props
}: { noIcon?: boolean; noTooltip?: boolean; noBrackets?: boolean; path: string } & TextProps): JSX.Element {
    const presence = usePresenceState();
    const [pageCount, setPageCount] = useState<number | null>(null);
    const mConference = useMaybeConference();

    useEffect(() => {
        return presence.observePage(path, mConference?.slug, (ids) => {
            setPageCount(ids.size);
        });
    }, [mConference?.slug, path, presence]);

    const pageCountLabel = pageCount
        ? `${pageCount} user${pageCount !== 1 ? "s" : ""} with an open tab here`
        : undefined;

    const innerEl = (
        <>
            {!noIcon ? (
                <FAIcon aria-label={pageCountLabel} iconStyle="s" icon="eye" verticalAlign="middle" />
            ) : undefined}
            <chakra.span
                verticalAlign={!noIcon ? "middle" : undefined}
                ml={!noIcon ? 2 : undefined}
                fontWeight={!noIcon ? "bold" : undefined}
            >
                {noIcon && !noBrackets ? "(" : ""}
                {pageCount}
                {noIcon && !noBrackets ? ")" : ""}
            </chakra.span>
        </>
    );

    return pageCountLabel ? (
        noTooltip ? (
            innerEl
        ) : (
            <Tooltip label={pageCountLabel}>
                <Box fontSize="1rem" {...props}>
                    {innerEl}
                </Box>
            </Tooltip>
        )
    ) : (
        <></>
    );
}
