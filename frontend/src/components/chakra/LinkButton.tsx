import { Button, ButtonProps, Link } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";

export interface LinkButtonProps extends ButtonProps {
    to: string;
    isExternal?: boolean;
}

export default function LinkButton(props: LinkButtonProps) {
    const { to, children, isExternal, ...remaining } = props;

    return (
        <Link as={ReactLink} to={to}>
            <Button {...remaining}>{children}</Button>
        </Link>
    );
}
