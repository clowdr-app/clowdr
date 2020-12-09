import { Link, Text } from "@chakra-ui/react";
import React from "react";
import LinkButton from "../Chakra/LinkButton";
import GenericErrorPage from "./GenericErrorPage";

export default function PageNotFound(): JSX.Element {
    return (
        <GenericErrorPage heading="Sorry, we couldn't find that page.">
            <>
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    Please double check the URL, and if this error persists,
                    please either contact your conference organiser or{" "}
                    <Link isExternal href="https://github.com/clowdr-app/">
                        our technical team
                    </Link>
                    .
                </Text>
                <LinkButton to="/">Go to home page</LinkButton>
            </>
        </GenericErrorPage>
    );
}
