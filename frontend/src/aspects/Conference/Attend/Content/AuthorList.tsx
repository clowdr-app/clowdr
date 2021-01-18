import { gql } from "@apollo/client";
import { Badge, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type {
    ContentGroupList_ContentPersonDataFragment,
    ContentPersonDataFragment,
} from "../../../../generated/graphql";

gql`
    fragment ContentPersonData on ContentGroupPerson {
        id
        person {
            id
            name
            affiliation
        }
        roleName
        priority
    }
`;

export function sortAuthors<T extends ContentGroupList_ContentPersonDataFragment>(x: T, y: T): number {
    if (typeof x.priority === "number") {
        if (typeof y.priority === "number") {
            return x.priority - y.priority;
        } else {
            return -1;
        }
    } else if (typeof y.priority === "number") {
        return 1;
    }
    return 0;
}

export function AuthorList({
    contentPeopleData,
    hideRole,
    hiddenRoles,
}: {
    contentPeopleData: readonly ContentPersonDataFragment[];
    hideRole?: boolean;
    hiddenRoles?: string[];
}): JSX.Element {
    const authorElements = useMemo(() => {
        const data =
            hiddenRoles && hiddenRoles.length > 0
                ? contentPeopleData.filter((x) => !hiddenRoles.includes(x.roleName.toLowerCase()))
                : contentPeopleData;
        return [...data].sort(sortAuthors).map((contentPersonData) => {
            return <Author contentPersonData={contentPersonData} key={contentPersonData.id} hideRole={hideRole} />;
        });
    }, [contentPeopleData, hiddenRoles, hideRole]);

    return (
        <HStack spacing="0" gridGap="8" wrap="wrap">
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
        <VStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
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
