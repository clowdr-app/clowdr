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
    hideRole,
}: {
    contentPeopleData: readonly ContentPersonDataFragment[];
    hideRole?: boolean;
}): JSX.Element {
    const authorElements = useMemo(() => {
        return contentPeopleData.map((contentPersonData) => {
            return <Author contentPersonData={contentPersonData} key={contentPersonData.id} hideRole={hideRole} />;
        });
    }, [contentPeopleData, hideRole]);

    return (
        <HStack spacing="0" gridGap="4" wrap="wrap">
            {authorElements}
        </HStack>
    );
}

export function Author({
    contentPersonData,
    hideRole,
}: {
    contentPersonData: ContentPersonDataFragment;
    hideRole?: boolean;
}): JSX.Element {
    return (
        <VStack textAlign="left" justifyContent="flex-start" alignItems="start">
            <Text fontWeight="bold">{contentPersonData.person.name}</Text>
            {!hideRole ? (
                <Badge ml="2" colorScheme="green" verticalAlign="initial">
                    {contentPersonData.roleName}
                </Badge>
            ) : undefined}
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
