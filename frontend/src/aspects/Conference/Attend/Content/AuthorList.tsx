import { gql } from "@apollo/client";
import { Badge, Box, HStack, Text } from "@chakra-ui/react";
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
        <Box textAlign="left">
            <Text fontWeight="bold" aria-label="Person">
                {contentPersonData.person.name}
                <Badge ml="2" colorScheme="green" verticalAlign="initial" aria-label="Role">
                    {contentPersonData.roleName}
                </Badge>
            </Text>
            <Text fontSize="sm">{contentPersonData.person.affiliation}</Text>
        </Box>
    );
}
