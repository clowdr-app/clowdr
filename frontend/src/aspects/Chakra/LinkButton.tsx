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
            {...linkProps}
            to={to}
            isExternal={isExternal}
            margin="0.3rem"
            textDecoration="none !important"
            tabIndex={-1}
        >
            <Button
                justifyContent="start"
                alignItems="center"
                display="inline-flex"
                flexDirection="column"
                width="100%"
                height="100%"
                margin={0}
                padding="0.7rem 1rem"
                {...remaining}
            >
                {children}
            </Button>
        </Link>
    );
}
