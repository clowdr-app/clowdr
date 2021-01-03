import { Button, ButtonProps, Link, LinkProps } from "@chakra-ui/react";
import React, { Ref } from "react";
import { Link as ReactLink } from "react-router-dom";

export interface LinkButtonProps extends ButtonProps {
    to: string;
    isExternal?: boolean;
    linkProps?: Omit<LinkProps, "to" | "isExternal" | "tabIndex">;
}

export default function LinkButton(props: LinkButtonProps & { ref?: Ref<HTMLAnchorElement> }): JSX.Element {
    const { to, children, isExternal, linkProps, ref, ...remaining } = props;

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
}
