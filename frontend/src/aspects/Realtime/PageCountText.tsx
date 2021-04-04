import { chakra, TextProps, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useMaybeConference } from "../Conference/useConference";
import FAIcon from "../Icons/FAIcon";
import { usePresenceState } from "./PresenceStateProvider";

export default function PageCountText({ path, ...props }: { path: string } & TextProps): JSX.Element {
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
            <chakra.span fontSize="1rem" {...props}>
                <FAIcon aria-label={pageCountLabel} iconStyle="s" icon="eye" verticalAlign="middle" />
                <chakra.span verticalAlign="middle" ml={2} fontWeight="bold">
                    {pageCount}
                </chakra.span>
            </chakra.span>
        </Tooltip>
    ) : (
        <></>
    );
}
