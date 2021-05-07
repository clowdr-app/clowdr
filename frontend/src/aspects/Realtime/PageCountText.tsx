import { Box, chakra, TextProps, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useMaybeConference } from "../Conference/useConference";
import FAIcon from "../Icons/FAIcon";
import { usePresenceState } from "./PresenceStateProvider";

export default function PageCountText({
    path,
    noIcon,
    ...props
}: { noIcon?: boolean; path: string } & TextProps): JSX.Element {
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

    return pageCountLabel ? (
        <Tooltip label={pageCountLabel}>
            <Box fontSize="1rem" {...props}>
                {!noIcon ? (
                    <FAIcon aria-label={pageCountLabel} iconStyle="s" icon="eye" verticalAlign="middle" />
                ) : undefined}
                <chakra.span
                    verticalAlign={!noIcon ? "middle" : undefined}
                    ml={!noIcon ? 2 : undefined}
                    fontWeight={!noIcon ? "bold" : undefined}
                >
                    {noIcon ? "(" : ""}
                    {pageCount}
                    {noIcon ? ")" : ""}
                </chakra.span>
            </Box>
        </Tooltip>
    ) : (
        <></>
    );
}
