import type { TextProps} from "@chakra-ui/react";
import { Box, chakra, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useMaybeConference } from "../Conference/useConference";
import FAIcon from "../Icons/FAIcon";
import { usePresenceState } from "./PresenceStateProvider";
import { useIntl } from "react-intl";

export default function PageCountText({
    path,
    noIcon,
    noTooltip = false,
    noBrackets = false,
    ...props
}: { noIcon?: boolean; noTooltip?: boolean; noBrackets?: boolean; path: string } & TextProps): JSX.Element {
    const intl = useIntl();
    const presence = usePresenceState();
    const [pageCount, setPageCount] = useState<number | null>(null);
    const mConference = useMaybeConference();

    useEffect(() => {
        return presence.observePage(path, mConference?.slug, (ids) => {
            setPageCount(ids.size);
        });
    }, [mConference?.slug, path, presence]);

    const pageCountLabel = pageCount
        ? intl.formatMessage({ id: 'realtime.pagecounttext.userscounter', defaultMessage: "{number} user(s) with an open tab here" }, { number: pageCount })
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
