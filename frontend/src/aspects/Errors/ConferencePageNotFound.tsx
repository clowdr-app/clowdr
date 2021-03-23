import { Text } from "@chakra-ui/react";
import React from "react";
import { LinkButton } from "../Chakra/LinkButton";
import { useTitle } from "../Utils/useTitle";
import GenericErrorPage from "./GenericErrorPage";

export default function ConferencePageNotFound(): JSX.Element {
    const title = useTitle("Conference page not found");

    return (
        <GenericErrorPage heading="Conference page not found">
            <>
                {title}
                <>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light" fontStyle="italic" maxW={600}>
                        Sorry, we couldn&apos;t find that page.
                    </Text>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                        You&apos;re logged in and have registered for the conference but we couldn&apos;t load the page
                        you requested. This may be because the organisers have not opened access to the conference to
                        you yet.
                    </Text>
                </>
                <LinkButton to="/">Go to home page</LinkButton>
            </>
        </GenericErrorPage>
    );
}
