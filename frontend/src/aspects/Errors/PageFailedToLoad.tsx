import { Button, Text } from "@chakra-ui/react";
import React from "react";
import GenericErrorPage from "./GenericErrorPage";
import { FormattedMessage, useIntl } from "react-intl";

export default function PageFailedToLoad({ children }: { children: JSX.Element | string }): JSX.Element {
    const intl = useIntl();
    return (
        <GenericErrorPage heading={intl.formatMessage({ id: 'errors.pagefailedtoload.sorry', defaultMessage: "Sorry, this page has failed to load…" })}>
            <>
                {typeof children === "string" ? (
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        {children}
                    </Text>
                ) : (
                    children
                )}
                <Button
                    aria-label={intl.formatMessage({ id: 'errors.pagefailedtoload.refresh', defaultMessage: "Refresh the page to try again" })}
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    <FormattedMessage
                        id="errors.pagefailedtoload.tryagain"
                        defaultMessage="Try again"
                    />
                </Button>
            </>
        </GenericErrorPage>
    );
}
