import { Heading, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { LinkButton } from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useTitle } from "../Utils/useTitle";
import { FormattedMessage, useIntl } from 'react-intl'

export default function LoggedOutPage(): JSX.Element {
    const intl = useIntl();
    const title = useTitle(intl.formatMessage({ id: 'auth.loggedoutpage.title', defaultMessage: "Logged Out" }));
    const mUser = useMaybeCurrentUser();

    if (mUser.loading) {
        return <CenteredSpinner spinnerProps={{ label: intl.formatMessage({ id: 'auth.loggedoutpage.loadinguserinfo', defaultMessage: "Loading user info" }) }} />;
    }

    if (mUser.user) {
        return <Redirect to="/user" />;
    } else {
        return (
            <>
                {title}
                <FAIcon iconStyle="s" icon="door-open" fontSize="6xl" />
                <Heading as="h1" id="page-heading" fontSize="4xl" lineHeight="revert">
                    <FormattedMessage
                        id="auth.loggedoutpage.loggedout"
                        defaultMessage="You have been logged out."
                    />
                </Heading>
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    <FormattedMessage
                        id="auth.loggedoutpage.hopeyouenjoyed"
                        defaultMessage="We hope you enjoyed using Midspace's open-source virtual conference software."
                    />
                    {/* <Link isExternal href="https://github.com/clowdr-app/">
                        open-source
                    </Link> */}
                </Text>
                <LinkButton to="/">
                    <FormattedMessage
                        id="auth.loggedoutpage.tohome"
                        defaultMessage="Go to home page"
                    />
                </LinkButton>
            </>
        );
    }
}
