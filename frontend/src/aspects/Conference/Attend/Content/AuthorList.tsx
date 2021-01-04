import { gql } from "@apollo/client";
import { Badge, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { ContentPersonDataFragment } from "../../../../generated/graphql";

gql`
    fragment ContentPersonData on ContentGroupPerson {
        id
        person {
            id
            name
            affiliation
        }
        roleName
    }
`;

export function AuthorList({
    contentPeopleData,
}: {
    contentPeopleData: readonly ContentPersonDataFragment[];
}): JSX.Element {
    const authorElements = useMemo(() => {
        return contentPeopleData.map((contentPersonData) => {
            return <Author contentPersonData={contentPersonData} key={contentPersonData.id} />;
        });
    }, [contentPeopleData]);

    return (
        <HStack spacing="0" gridGap="4" wrap="wrap">
            {authorElements}
        </HStack>
    );
}

export function Author({ contentPersonData }: { contentPersonData: ContentPersonDataFragment }): JSX.Element {
    return (
        <VStack textAlign="left" justifyContent="start" alignItems="start" flexBasis="1 1 50%">
            <Text fontWeight="bold" aria-label="Person">
                {contentPersonData.person.name}
            </Text>
            <Badge ml="2" colorScheme="green" verticalAlign="initial" aria-label="Role">
                {contentPersonData.roleName}
            </Badge>
            <Text fontSize="sm">
                {contentPersonData.person.affiliation &&
                contentPersonData.person.affiliation !== "None" &&
                contentPersonData.person.affiliation !== "undefined" ? (
                    contentPersonData.person.affiliation
                ) : (
                    <>&nbsp;</>
                )}
            </Text>
        </VStack>
    );
}
