import { gql } from "@apollo/client";
import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
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

    return <HStack spacing="5">{authorElements}</HStack>;
}

export function Author({ contentPersonData }: { contentPersonData: ContentPersonDataFragment }): JSX.Element {
    return (
        <Flex>
            <Box>
                <Text fontWeight="bold">
                    {contentPersonData.person.name}
                    <Badge ml="2" colorScheme="green" verticalAlign="initial">
                        {contentPersonData.roleName}
                    </Badge>
                </Text>
                <Text fontSize="sm">{contentPersonData.person.affiliation}</Text>
            </Box>
        </Flex>
    );
}
