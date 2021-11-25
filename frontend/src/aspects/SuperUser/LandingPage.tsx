import { Code, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useSuperUserStateQuery } from "../../generated/graphql";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { makeContext } from "../GQL/make-context";
import { useTitle } from "../Utils/useTitle";
import SuperUserInitialise from "./Initialise";
import SuperUserLandingPageContent from "./LandingPageContent";

gql`
    query SuperUserState {
        system_SuperUserState {
            isInitialised
            canBeDirectlyInitialised
        }
    }
`;

export default function SuperUserLandingPage(): JSX.Element {
    const title = useTitle("Superuser");

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Superuser,
            }),
        []
    );
    const [suStateResponse] = useSuperUserStateQuery({
        context,
    });

    return (
        <VStack w="100%" mt={2} spacing={4}>
            {title}
            <Heading>Superuser</Heading>
            {suStateResponse.fetching && !suStateResponse.data?.system_SuperUserState.length ? (
                <CenteredSpinner />
            ) : undefined}
            {suStateResponse.data?.system_SuperUserState.length ? (
                suStateResponse.data.system_SuperUserState[0].isInitialised ? (
                    <SuperUserLandingPageContent />
                ) : suStateResponse.data.system_SuperUserState[0].canBeDirectlyInitialised ? (
                    <SuperUserInitialise />
                ) : (
                    <>
                        <Container>
                            <Text>
                                A superuser is not initialised and cannot be initialised directly through the UI. Direct
                                initialisation is only available when only a single user exists.
                            </Text>
                        </Container>
                        <Container>
                            <Text>
                                To initialise a superuser, please create the relevent Superuser Permission Grant record
                                directly in Hasura (look in the <Code>system</Code> schema). Insert a record for your
                                user id, granting the permission <Code>INSERT_SU_PERMISSION</Code>
                                with the target permission also being <Code>INSERT_SU_PERMISSION</Code>. Then reload
                                this page.
                            </Text>
                        </Container>
                    </>
                )
            ) : undefined}
        </VStack>
    );
}
