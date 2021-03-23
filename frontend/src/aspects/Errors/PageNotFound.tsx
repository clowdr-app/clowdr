import { Link, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { LinkButton } from "../Chakra/LinkButton";
import { useTitle } from "../Utils/useTitle";
import GenericErrorPage from "./GenericErrorPage";

export default function PageNotFound({ loggedIn }: { loggedIn?: boolean }): JSX.Element {
    const title = useTitle("Page not found");
    const location = useLocation();
    const conferenceSlug = useMemo(() => {
        const matches = location.pathname.match(/^\/conference\/([^/]+)/);
        if (matches && matches.length > 1) {
            return matches[1];
        }
        return undefined;
    }, [location.pathname]);
    // conferenceSlug ? `/conference/${conferenceSlug}` :

    return (
        <GenericErrorPage heading="Sorry, we couldn't find that page.">
            <>
                {title}
                {conferenceSlug && loggedIn ? (
                    <>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" fontStyle="italic" maxW={600}>
                            You are logged in but...
                        </Text>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                            ...you may not have received or accepted your invitation to the conference you&apos;re
                            trying to access. You are logged into Clowdr but you will need the invitation code sent via
                            email by your conference to access its private pages.
                        </Text>
                    </>
                ) : loggedIn ? (
                    <>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" fontStyle="italic" maxW={600}>
                            You are not logged in
                        </Text>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                            Please try going to the home page and logging in, then return to this page.
                        </Text>
                    </>
                ) : (
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                        Please double check the URL, and if this error persists, please either contact your conference
                        organiser or{" "}
                        <Link isExternal href="https://github.com/clowdr-app/">
                            our technical team
                        </Link>
                        .
                    </Text>
                )}
                <LinkButton to="/">Go to home page</LinkButton>
            </>
        </GenericErrorPage>
    );
}
