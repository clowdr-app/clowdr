import { gql } from "@apollo/client";
import { Badge, Button, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { ItemList_ProgramPersonDataFragment, ProgramPersonDataFragment } from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import { useRegistrant } from "../../RegistrantsContext";
import ProfileModal from "../Registrant/ProfileModal";

gql`
    fragment ProgramPersonData on content_ItemProgramPerson {
        id
        person {
            id
            name
            affiliation
            registrantId
        }
        roleName
        priority
    }
`;

export function sortAuthors<T extends ItemList_ProgramPersonDataFragment>(x: T, y: T): number {
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
    programPeopleData,
    hideRole,
    hiddenRoles,
}: {
    programPeopleData: readonly ProgramPersonDataFragment[];
    hideRole?: boolean;
    hiddenRoles?: string[];
}): JSX.Element {
    const [authorEls, presenterEls, chairEls, othersEls] = useMemo(() => {
        const data =
            hiddenRoles && hiddenRoles.length > 0
                ? programPeopleData.filter((x) => !hiddenRoles.includes(x.roleName.toLowerCase()))
                : [...programPeopleData];
        const authors = data.filter((x) => x.roleName.toUpperCase() === "AUTHOR");
        const presenters = data.filter((x) => x.roleName.toUpperCase() === "PRESENTER");
        const chairs = data.filter((x) => x.roleName.toUpperCase() === "CHAIR");
        const others = data.filter(
            (x) =>
                x.roleName.toUpperCase() !== "AUTHOR" &&
                x.roleName.toUpperCase() !== "PRESENTER" &&
                x.roleName.toUpperCase() !== "CHAIR"
        );

        const createEl = (programPersonData: ProgramPersonDataFragment) => {
            return <Author programPersonData={programPersonData} key={programPersonData.id} hideRole={hideRole} />;
        };

        return [
            authors.sort(sortAuthors).map(createEl),
            presenters.sort(sortAuthors).map(createEl),
            chairs.sort(sortAuthors).map(createEl),
            others.sort(sortAuthors).map(createEl),
        ];
    }, [programPeopleData, hiddenRoles, hideRole]);

    return (
        <>
            {authorEls.length > 0 ? (
                <HStack spacing="0" gridGap="8" wrap="wrap" alignItems="flex-start">
                    {authorEls}
                </HStack>
            ) : undefined}
            {presenterEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridGap="8"
                    wrap="wrap"
                    alignItems="flex-start"
                    mt={authorEls.length > 0 ? 8 : undefined}
                >
                    {presenterEls}
                </HStack>
            ) : undefined}
            {chairEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridGap="8"
                    wrap="wrap"
                    alignItems="flex-start"
                    mt={authorEls.length > 0 || presenterEls.length > 0 ? 8 : undefined}
                >
                    {chairEls}
                </HStack>
            ) : undefined}
            {othersEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridGap="8"
                    wrap="wrap"
                    alignItems="flex-start"
                    mt={chairEls.length > 0 || authorEls.length > 0 || presenterEls.length > 0 ? 8 : undefined}
                >
                    {othersEls}
                </HStack>
            ) : undefined}
        </>
    );
}

export function Author({
    programPersonData,
    hideRole,
    badgeColour,
}: {
    programPersonData: ProgramPersonDataFragment;
    hideRole?: boolean;
    badgeColour?: string;
}): JSX.Element {
    const registrant = useRegistrant(
        programPersonData.person.registrantId && { registrant: programPersonData.person.registrantId }
    );
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
        <VStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
            {programPersonData.person.registrantId ? (
                <Button
                    onClick={() => onOpen()}
                    variant="ghost"
                    p={0}
                    m={0}
                    lineHeight={1.5}
                    fontWeight="bold"
                    h="auto"
                    overflowWrap="normal"
                >
                    <FAIcon iconStyle="s" icon="user" mr={2} fontSize="xs" />
                    {programPersonData.person.name}
                </Button>
            ) : (
                <Text fontWeight="bold">{programPersonData.person.name}</Text>
            )}
            {!hideRole ? (
                <Badge
                    ml="2"
                    colorScheme={
                        badgeColour ?? programPersonData.roleName.toUpperCase() === "AUTHOR"
                            ? "green"
                            : programPersonData.roleName.toUpperCase() === "CHAIR"
                            ? "yellow"
                            : "red"
                    }
                    verticalAlign="initial"
                >
                    {programPersonData.roleName}
                </Badge>
            ) : undefined}
            <Text fontSize="sm" maxW={180}>
                {programPersonData.person.affiliation &&
                programPersonData.person.affiliation !== "None" &&
                programPersonData.person.affiliation !== "undefined" ? (
                    programPersonData.person.affiliation
                ) : (
                    <>&nbsp;</>
                )}
            </Text>
            {registrant && registrant.profile ? (
                <ProfileModal
                    registrant={{
                        ...registrant,
                        profile: registrant.profile,
                    }}
                    isOpen={isOpen}
                    onClose={onClose}
                />
            ) : undefined}
        </VStack>
    );
}
