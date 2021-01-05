import { Badge, HStack, Text, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { Timeline_EventPersonFragment } from "../../../../generated/graphql";

export function EventPersonList({ people }: { people: readonly Timeline_EventPersonFragment[] }): JSX.Element {
    const authorElements = useMemo(() => {
        return people.map((person) => {
            return <Person person={person} key={person.id} />;
        });
    }, [people]);

    return (
        <HStack spacing="0" gridGap="4" wrap="wrap">
            {authorElements}
        </HStack>
    );
}

export function Person({ person }: { person: Timeline_EventPersonFragment }): JSX.Element {
    return (
        <VStack textAlign="left" justifyContent="flex-start" alignItems="start" flexBasis="1 1 50%">
            <Text fontWeight="bold">{person.name}</Text>
            <Badge ml="2" colorScheme="green" verticalAlign="initial">
                {person.roleName}
            </Badge>
            <Text fontSize="sm">
                {person.affiliation && person.affiliation !== "None" && person.affiliation !== "undefined" ? (
                    person.affiliation
                ) : (
                    <>&nbsp;</>
                )}
            </Text>
        </VStack>
    );
}
