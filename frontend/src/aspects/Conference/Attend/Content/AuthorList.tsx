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
    const [authorEls, chairEls, othersEls] = useMemo(() => {
        const data =
            hiddenRoles && hiddenRoles.length > 0
                ? contentPeopleData.filter((x) => !hiddenRoles.includes(x.roleName.toLowerCase()))
                : [...contentPeopleData];
        const authors = data.filter((x) => x.roleName.toUpperCase() === "AUTHOR");
        const chairs = data.filter((x) => x.roleName.toUpperCase() === "CHAIR");
        const others = data.filter(
            (x) => x.roleName.toUpperCase() !== "AUTHOR" && x.roleName.toUpperCase() !== "CHAIR"
        );

        const createEl = (contentPersonData: ContentPersonDataFragment) => {
            return <Author contentPersonData={contentPersonData} key={contentPersonData.id} hideRole={hideRole} />;
        };

        return [
            authors.sort(sortAuthors).map(createEl),
            chairs.sort(sortAuthors).map(createEl),
            others.sort(sortAuthors).map(createEl),
        ];
    }, [contentPeopleData, hiddenRoles, hideRole]);

    return (
        <>
            {authorEls.length > 0 ? (
                <HStack spacing="0" gridGap="8" wrap="wrap">
                    {authorEls}
                </HStack>
            ) : undefined}
            {chairEls.length > 0 ? (
                <HStack spacing="0" gridGap="8" wrap="wrap" mt={authorEls.length > 0 ? 8 : undefined}>
                    {chairEls}
                </HStack>
            ) : undefined}
            {othersEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridGap="8"
                    wrap="wrap"
                    mt={chairEls.length > 0 || authorEls.length > 0 ? 8 : undefined}
                >
                    {othersEls}
                </HStack>
            ) : undefined}
        </>
    );
}

export function Author({
    contentPersonData,
    hideRole,
    badgeColour,
}: {
    contentPersonData: ContentPersonDataFragment;
    hideRole?: boolean;
    badgeColour?: string;
}): JSX.Element {
    return (
        <VStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
            <Text fontWeight="bold">{contentPersonData.person.name}</Text>
            {!hideRole ? (
                <Badge
                    ml="2"
                    colorScheme={
                        badgeColour ?? contentPersonData.roleName.toUpperCase() === "AUTHOR"
                            ? "green"
                            : contentPersonData.roleName.toUpperCase() === "CHAIR"
                            ? "yellow"
                            : "red"
                    }
                    verticalAlign="initial"
                >
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
