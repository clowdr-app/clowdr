import { chakra, TextProps, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import usePolling from "../Generic/usePolling";
import FAIcon from "../Icons/FAIcon";
import { usePresenceCount } from "./PresenceCountProvider";

export default function PageCountText({ path, ...props }: { path: string } & TextProps): JSX.Element {
    const { getPageCountOf } = usePresenceCount();
    const [pageCount, setPageCount] = useState<number | null>(null);

    const cb = useCallback(async () => {
        const count = await getPageCountOf(path);
        setPageCount(count ?? null);
    }, [getPageCountOf, path]);
    useEffect(() => {
        cb();
    }, [cb]);
    usePolling(cb, 2 * 60 * 1000, true);

    const pageCountLabel = pageCount ? `${pageCount} user${pageCount !== 1 ? "s" : ""} present` : undefined;

    return pageCountLabel ? (
        <Tooltip label={pageCountLabel}>
            <chakra.span fontSize="1rem" {...props}>
                <FAIcon aria-label={pageCountLabel} iconStyle="s" icon="users" verticalAlign="middle" />
                <chakra.span verticalAlign="middle" ml={2} fontWeight="bold">
                    {pageCount}
                </chakra.span>
            </chakra.span>
        </Tooltip>
    ) : <></>;
}
