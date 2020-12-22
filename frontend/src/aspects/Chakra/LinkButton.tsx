import { Button, ButtonProps, Link, LinkProps } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";

export interface LinkButtonProps extends ButtonProps {
    to: string;
    isExternal?: boolean;
    linkProps?: Omit<LinkProps, "to" | "isExternal" | "tabIndex">;
}

export default function LinkButton(props: LinkButtonProps): JSX.Element {
    const { to, children, isExternal, linkProps, ...remaining } = props;

    return (
        <Link
            as={ReactLink}
            to={to}
            isExternal={isExternal}
            textDecoration="none !important"
            tabIndex={-1}
            display="inline-block"
            {...linkProps}
        >
            <Button {...remaining}>{children}</Button>
        </Link>
    );
}
