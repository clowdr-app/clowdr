import { Button, Text } from "@chakra-ui/react";
import React from "react";
import GenericErrorPage from "./GenericErrorPage";

export default function PageFailedToLoad({ children }: { children: JSX.Element | string }): JSX.Element {
    return (
        <GenericErrorPage heading="Sorry, this page has failed to load…">
            <>
                {typeof children === "string" ? (
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        {children}
                    </Text>
                ) : (
                    children
                )}
                <Button
                    aria-label="Refresh the page to try again"
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    {" "}
                    Try again
                </Button>
            </>
        </GenericErrorPage>
    );
}
