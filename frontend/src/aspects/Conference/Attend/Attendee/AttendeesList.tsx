import { Button, Center, Image, SimpleGrid, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
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
                    flex="0 0 50px"
                    aria-describedby={`attendee-trigger-${attendee.id}`}
                    src={attendee.profile.photoURL_50x50}
                />
            ) : (
                <Center w="50px" h="50px" flex="0 0 50px">
                    <FAIcon iconStyle="s" icon="cat" />
                </Center>
            )}
            <Center maxH="100%" flex="0 1 auto" py={2} mx={4} overflow="hidden">
                <Text
                    as="span"
                    id={`attendee-trigger-${attendee.id}`}
                    maxW="100%"
                    whiteSpace="normal"
                    overflowWrap="anywhere"
                >
                    {attendee.displayName}
                </Text>
            </Center>
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
                    attendee={attendee}
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
