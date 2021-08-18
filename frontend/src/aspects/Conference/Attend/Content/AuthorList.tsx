import { gql } from "@apollo/client";
import { Badge, Button, HStack, Text, TextProps, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import type {
    ProfileDataFragment,
    ProgramPersonDataFragment,
    RegistrantDataFragment,
} from "../../../../generated/graphql";
import ChatProfileModalProvider, { useChatProfileModal } from "../../../Chat/Frame/ChatProfileModalProvider";
import ProfileBox from "../../../Chat/Messages/ProfileBox";
import { FAIcon } from "../../../Icons/FAIcon";
import { maybeCompare } from "../../../Utils/maybeSort";
import { useRegistrant } from "../../RegistrantsContext";

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
    return registrant?.profile ? (
        <ChatProfileModalProvider>
            <AuthorWithProfileContent
                programPersonData={programPersonData}
                hideRole={hideRole}
                badgeColour={badgeColour}
                registrant={registrant}
                profile={registrant.profile}
            />
        </ChatProfileModalProvider>
    ) : (
        <VStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
            <Text fontWeight="bold" overflowWrap="normal" whiteSpace="normal">
                {programPersonData.person.name}
            </Text>
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
                <Text fontSize="sm" maxW={180} overflowWrap="normal" whiteSpace="normal">
                    {programPersonData.person.affiliation}
                </Text>
            ) : undefined}
        </VStack>
    );
}

function AuthorWithProfileContent({
    programPersonData,
    hideRole,
    badgeColour,
    registrant,
    profile,
}: {
    programPersonData: ProgramPersonDataFragment;
    hideRole?: boolean;
    badgeColour?: string;
    registrant: RegistrantDataFragment;
    profile: ProfileDataFragment;
}) {
    const profileModal = useChatProfileModal();
    return (
        <HStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
            {profile.photoURL_50x50 ? (
                <ProfileBox
                    mt={1}
                    registrant={registrant}
                    showPlaceholderProfilePictures={true}
                    showProfilePictures={true}
                />
            ) : undefined}
            <VStack textAlign="left" justifyContent="flex-start" alignItems="flex-start">
                <Button
                    onClick={() =>
                        profileModal.open({
                            ...registrant,
                            profile,
                        })
                    }
                    variant="ghost"
                    p={0}
                    m={0}
                    lineHeight={1.5}
                    fontWeight="bold"
                    h="auto"
                    overflowWrap="normal"
                    whiteSpace="normal"
                >
                    {!profile.photoURL_50x50 ? <FAIcon iconStyle="s" icon="user" mr={2} fontSize="xs" /> : undefined}
                    {programPersonData.person.name}
                </Button>
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
                {profile.affiliation?.trim().length ||
                (programPersonData.person.affiliation &&
                    programPersonData.person.affiliation !== "None" &&
                    programPersonData.person.affiliation !== "undefined") ? (
                    <Text fontSize="sm" maxW={180} overflowWrap="normal" whiteSpace="normal">
                        {profile.affiliation?.trim().length
                            ? profile.affiliation.trim()
                            : programPersonData.person.affiliation}
                    </Text>
                ) : undefined}
            </VStack>
        </HStack>
    );
}

export function PlainAuthorsList({
    people,
    sortByNameOnly,
    ...props
}: { people: readonly ProgramPersonDataFragment[]; sortByNameOnly?: boolean } & TextProps): JSX.Element {
    return (
        <Text w="100%" whiteSpace="normal" {...props}>
            {R.intersperse(
                ", ",
                R.sortWith<ProgramPersonDataFragment>(
                    sortByNameOnly
                        ? [
                              (x, y) => sortByRoleName(x.roleName, y.roleName),
                              (x, y) => x.person.name.localeCompare(y.person.name),
                          ]
                        : [
                              (x, y) => sortByRoleName(x.roleName, y.roleName),
                              (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
                              (x, y) => x.person.name.localeCompare(y.person.name),
                          ],
                    R.uniqBy((x) => x.person.id, people)
                ).map((x) => x.person.name)
            ).reduce((acc, x) => acc + x, "")}
        </Text>
    );
}

function sortByRoleName(roleX: string, roleY: string): number {
    return roleToIndex(roleX) - roleToIndex(roleY);
}

const rolePositions = ["PRESENTER", "AUTHOR", "CHAIR"];
function roleToIndex(role: string) {
    const idx = rolePositions.indexOf(role);
    if (idx === -1) {
        return rolePositions.length;
    }
    return idx;
}
