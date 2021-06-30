import { Button, ButtonProps, Link, LinkProps } from "@chakra-ui/react";
import React, { Ref } from "react";
import { Link as ReactLink } from "react-router-dom";
import { FAIcon } from "../Icons/FAIcon";

export interface LinkButtonProps extends ButtonProps {
    to: string;
    isExternal?: boolean;
    linkProps?: Omit<LinkProps, "to" | "isExternal" | "tabIndex">;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
    props: LinkButtonProps,
    ref
): JSX.Element {
    const { to, children, isExternal, linkProps, ...remaining } = props;

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

export function ExternalLinkButton(props: LinkButtonProps & { ref?: Ref<HTMLAnchorElement> }): JSX.Element {
    const { to, children, isExternal, linkProps, ref, ...remaining } = props;

    return (
        <Link
            href={to}
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
}

export function DownloadButton(props: LinkButtonProps & { ref?: Ref<HTMLAnchorElement> }): JSX.Element {
    const { to, children, isExternal, linkProps, ref, ...remaining } = props;

    return (
        <Link
            href={to}
            isExternal={isExternal}
            textDecoration="none !important"
            display="inline-block"
            {...linkProps}
            target="_blank"
            download={true}
            ref={ref}
        >
            <Button as="div" {...remaining} leftIcon={<FAIcon iconStyle="s" icon="file-download" />}>
                {children}
            </Button>
        </Link>
    );
}
