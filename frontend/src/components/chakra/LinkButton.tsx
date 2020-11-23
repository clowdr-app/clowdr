import { Button, ButtonProps, Link } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";

export interface LinkButtonProps extends ButtonProps {
    to: string;
    isExternal?: boolean;
}

export default function LinkButton(props: LinkButtonProps): JSX.Element {
    const { to, children, isExternal, ...remaining } = props;

    return (
        <Link as={ReactLink} to={to} isExternal={isExternal} tabIndex={-1}>
            <Button {...remaining} width="100%">
                {children}
            </Button>
        </Link>
    );
}
