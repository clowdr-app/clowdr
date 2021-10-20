import { Button, ButtonProps, Link, LinkProps } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import { FAIcon } from "../Icons/FAIcon";

export interface LinkButtonProps extends ButtonProps {
    to: string;
    isExternal?: boolean;
    linkProps?: Omit<LinkProps, "to" | "isExternal" | "tabIndex">;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
    { to, children, isExternal, linkProps, ...remaining }: LinkButtonProps,
    ref
): JSX.Element {
    return (
        <Link
            as={ReactLink}
            to={to}
            isExternal={isExternal}
            textDecoration="none !important"
            display="inline-block"
            {...linkProps}
            ref={ref}
        >
            <Button as="div" {...remaining}>
                {children}
            </Button>
        </Link>
    );
});

export const ExternalLinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(function ExternalLinkButton(
    { to, children, isExternal, linkProps, ...remaining }: LinkButtonProps,
    ref
): JSX.Element {
    return (
        <Link
            href={to}
            isExternal={isExternal ?? true}
            textDecoration="none !important"
            display="inline-block"
            {...linkProps}
            ref={ref}
        >
            <Button as="div" {...remaining}>
                {children}
            </Button>
        </Link>
    );
});

export const DownloadButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps & { fileName?: string }>(
    function DownloadButton(
        { fileName, to, children, linkProps, ...remaining }: LinkButtonProps & { fileName?: string },
        ref
    ): JSX.Element {
        return (
            <Link
                href={to}
                isExternal={true}
                textDecoration="none !important"
                display="inline-block"
                {...linkProps}
                target="_blank"
                download={fileName ?? true}
                ref={ref}
            >
                <Button as="div" {...remaining} leftIcon={<FAIcon iconStyle="s" icon="file-download" />}>
                    {children}
                </Button>
            </Link>
        );
    }
);
