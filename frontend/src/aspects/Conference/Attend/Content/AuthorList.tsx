import { gql } from "@apollo/client";
import { Badge, Button, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { ProgramPersonDataFragment, RegistrantDataFragment } from "../../../../generated/graphql";
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

export function sortAuthors<T extends ProgramPersonDataFragment>(x: T, y: T): number {
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
    noRegistrantLink,
}: {
    programPeopleData: readonly ProgramPersonDataFragment[];
    hideRole?: boolean;
    hiddenRoles?: string[];
    noRegistrantLink?: boolean;
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
            return (
                <Author
                    programPersonData={programPersonData}
                    key={programPersonData.id}
                    hideRole={hideRole}
                    noRegistrantLink={noRegistrantLink}
                />
            );
        };

        return [
            authors.sort(sortAuthors).map(createEl),
            presenters.sort(sortAuthors).map(createEl),
            chairs.sort(sortAuthors).map(createEl),
            others.sort(sortAuthors).map(createEl),
        ];
    }, [programPeopleData, hiddenRoles, hideRole, noRegistrantLink]);

    const colSpacing = "8";
    const rowSpacing = "2";
    const groupSpacing = 2;
    return (
        <>
            {authorEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridColumnGap={colSpacing}
                    gridRowGap={rowSpacing}
                    wrap="wrap"
                    alignItems="flex-start"
                >
                    {authorEls}
                </HStack>
            ) : undefined}
            {presenterEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridColumnGap={colSpacing}
                    gridRowGap={rowSpacing}
                    wrap="wrap"
                    alignItems="flex-start"
                    mt={authorEls.length > 0 ? groupSpacing : undefined}
                >
                    {presenterEls}
                </HStack>
            ) : undefined}
            {chairEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridColumnGap={colSpacing}
                    gridRowGap={rowSpacing}
                    wrap="wrap"
                    alignItems="flex-start"
                    mt={authorEls.length > 0 || presenterEls.length > 0 ? groupSpacing : undefined}
                >
                    {chairEls}
                </HStack>
            ) : undefined}
            {othersEls.length > 0 ? (
                <HStack
                    spacing="0"
                    gridColumnGap={colSpacing}
                    gridRowGap={rowSpacing}
                    wrap="wrap"
                    alignItems="flex-start"
                    mt={
                        chairEls.length > 0 || authorEls.length > 0 || presenterEls.length > 0
                            ? groupSpacing
                            : undefined
                    }
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
    noRegistrantLink,
}: {
    programPersonData: ProgramPersonDataFragment;
    hideRole?: boolean;
    badgeColour?: string;
    noRegistrantLink?: boolean;
}): JSX.Element {
    if (!noRegistrantLink && programPersonData.person.registrantId) {
        return (
            <AuthorWithRegistrant
                programPersonData={programPersonData}
                hideRole={hideRole}
                badgeColour={badgeColour}
                registrantId={programPersonData.person.registrantId}
            />
        );
    } else {
        return (
            <AuthorInner
                programPersonData={programPersonData}
                hideRole={hideRole}
                badgeColour={badgeColour}
                registrant={null}
            />
        );
    }
}

export function AuthorWithRegistrant({
    programPersonData,
    hideRole,
    badgeColour,
    registrantId,
}: {
    programPersonData: ProgramPersonDataFragment;
    hideRole?: boolean;
    badgeColour?: string;
    registrantId: string;
}): JSX.Element {
    const idObj = useMemo(() => ({ registrant: registrantId }), [registrantId]);
    const registrant = useRegistrant(idObj);

    return (
        <AuthorInner
            programPersonData={programPersonData}
            hideRole={hideRole}
            badgeColour={badgeColour}
            registrant={registrant}
        />
    );
}

export function AuthorInner({
    programPersonData,
    hideRole,
    badgeColour,
    registrant,
}: {
    programPersonData: ProgramPersonDataFragment;
    hideRole?: boolean;
    badgeColour?: string;
    registrant: RegistrantDataFragment | null;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
        <VStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
            {registrant?.profile ? (
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
                            ? "purple"
                            : programPersonData.roleName.toUpperCase() === "CHAIR"
                            ? "yellow"
                            : "red"
                    }
                    verticalAlign="initial"
                >
                    {programPersonData.roleName}
                </Badge>
            ) : undefined}
            {programPersonData.person.affiliation &&
            programPersonData.person.affiliation !== "None" &&
            programPersonData.person.affiliation !== "undefined" ? (
                <Text fontSize="sm" maxW={180}>
                    {programPersonData.person.affiliation}
                </Text>
            ) : undefined}
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
