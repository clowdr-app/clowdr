import { Button, Center, Flex, Image, SimpleGrid, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import BadgeList from "../../../Badges/BadgeList";
import FAIcon from "../../../Icons/FAIcon";
import type { Attendee } from "../../useCurrentAttendee";
import ProfileModal from "./ProfileModal";

export function AttendeeTile({ attendee, onClick }: { attendee: Attendee; onClick: () => void }): JSX.Element {
    return (
        <Button
            variant="outline"
            borderRadius={0}
            p={0}
            w="auto"
            h="auto"
            minH="50px"
            justifyContent="flex-start"
            onClick={onClick}
            overflow="hidden"
        >
            {attendee.profile.photoURL_50x50 ? (
                <Image
                    flex="0 0 60px"
                    aria-describedby={`attendee-trigger-${attendee.id}`}
                    src={attendee.profile.photoURL_50x50}
                    w="60px"
                    h="60px"
                />
            ) : (
                <Center w="60px" h="60px" flex="0 0 60px">
                    <FAIcon iconStyle="s" icon="cat" />
                </Center>
            )}
            <Flex
                h="100%"
                flex="0 1 auto"
                mx={4}
                overflow="hidden"
                flexDir="column"
                justifyContent="center"
                alignItems="flex-start"
            >
                <Text
                    as="span"
                    id={`attendee-trigger-${attendee.id}`}
                    maxW="100%"
                    whiteSpace="normal"
                    overflowWrap="anywhere"
                    fontSize="sm"
                >
                    {attendee.displayName}
                </Text>
                {attendee.profile.badges ? (
                    <BadgeList
                        badges={R.slice(0, 3, attendee.profile.badges)}
                        mt={2}
                        whiteSpace="normal"
                        textAlign="left"
                        noBottomMargin
                    />
                ) : undefined}
            </Flex>
        </Button>
    );
}

export default function AttendeesList({
    allAttendees,
    searchedAttendees,
}: {
    allAttendees?: Attendee[];
    searchedAttendees?: Attendee[];
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const openProfileModal = useCallback(
        (attendee: Attendee) => {
            setSelectedAttendee(attendee);
            onOpen();
        },
        [onOpen]
    );

    const allAttendeesEls = useMemo(
        () =>
            allAttendees?.map((attendee, idx) => (
                <AttendeeTile
                    key={attendee.id + "-all-" + idx}
                    attendee={{
                        ...attendee,
                        profile: {
                            ...attendee.profile,
                            badges: attendee.profile.badges && R.slice(0, 3, attendee.profile.badges),
                        },
                    }}
                    onClick={() => {
                        openProfileModal(attendee);
                    }}
                />
            )),
        [allAttendees, openProfileModal]
    );
    const allSearchedEls = useMemo(
        () =>
            searchedAttendees?.map((attendee, idx) => (
                <AttendeeTile
                    key={attendee.id + "-search-" + idx}
                    attendee={attendee}
                    onClick={() => {
                        openProfileModal(attendee);
                    }}
                />
            )),
        [openProfileModal, searchedAttendees]
    );

    const attendeesEls = allSearchedEls ?? allAttendeesEls;

    return attendeesEls ? (
        <>
            <SimpleGrid
                columns={[1, Math.min(2, attendeesEls.length), Math.min(3, attendeesEls.length)]}
                autoRows="min-content"
                spacing={[2, 2, 4]}
                maxW="5xl"
            >
                {attendeesEls}
            </SimpleGrid>
            <ProfileModal isOpen={isOpen} onClose={onClose} attendee={selectedAttendee} />
        </>
    ) : (
        <div>
            <Spinner />
        </div>
    );
}
