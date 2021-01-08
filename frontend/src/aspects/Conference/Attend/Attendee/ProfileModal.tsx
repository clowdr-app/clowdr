import {
    Box,
    Heading,
    HStack,
    Image,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Portal,
    Spacer,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import BadgeList from "../../../Badges/BadgeList";
import LinkButton from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import PronounList from "../../../Pronouns/PronounList";
import { Markdown } from "../../../Text/Markdown";
import { useConference } from "../../useConference";
import type { Attendee } from "../../useCurrentAttendee";
import AttendeeExtraInfo from "../Profile/AttendeeExtraInfo";

export default function ProfileModal({
    attendee,
    isOpen,
    onClose,
}: {
    attendee: Attendee | null;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    return (
        <Portal>
            <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent maxW={350}>
                    <ModalCloseButton />
                    <ModalHeader>
                        {attendee ? (
                            <>
                                <Heading as="h4" size="sm" textAlign="left" mr={8}>
                                    {attendee.displayName}
                                    <br />
                                    {attendee.profile.affiliation ? (
                                        <Text as="span" fontStyle="italic" fontSize="0.9em">
                                            ({attendee.profile.affiliation})
                                        </Text>
                                    ) : undefined}
                                </Heading>
                            </>
                        ) : undefined}
                    </ModalHeader>
                    <ModalBody px={0}>
                        {attendee ? (
                            <VStack spacing={4}>
                                <HStack justifyContent="flex-start" w="100%" px={2} alignItems="flex-start">
                                    <VStack alignItems="flex-start">
                                        {attendee.profile.pronouns ? (
                                            <PronounList pronouns={attendee.profile.pronouns} px={2} />
                                        ) : undefined}
                                        {attendee.profile.affiliation ? (
                                            <Text>
                                                {attendee.profile.affiliationURL ? (
                                                    <>
                                                        <FAIcon iconStyle="s" icon="link" fontSize="0.7rem" />
                                                        &nbsp;
                                                        <Link
                                                            isExternal
                                                            href={`https://${attendee.profile.affiliationURL}`}
                                                        >
                                                            {attendee.profile.affiliation}
                                                        </Link>
                                                    </>
                                                ) : (
                                                    attendee.profile.affiliation
                                                )}
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                    <Spacer />
                                    <LinkButton
                                        to={`/conference/${conference.slug}/profile/view/${attendee.id}`}
                                        size="sm"
                                        variant="outline"
                                        colorScheme="green"
                                    >
                                        <FAIcon iconStyle="s" icon="link" mr={2} />
                                        View profile
                                    </LinkButton>
                                </HStack>
                                {attendee.profile.photoURL_350x350 ? (
                                    <Image
                                        maxW={350}
                                        maxH={350}
                                        w="100%"
                                        h="auto"
                                        aria-describedby={`attendee-trigger-${attendee.id}`}
                                        src={attendee.profile.photoURL_350x350}
                                    />
                                ) : undefined}
                                {attendee.profile.badges ? (
                                    <BadgeList badges={attendee.profile.badges} px={2} />
                                ) : undefined}
                                {attendee.profile.bio ? (
                                    <Box py={0} px={2} w="100%">
                                        <Markdown restrictHeadingSize>{attendee.profile.bio}</Markdown>
                                    </Box>
                                ) : undefined}
                                <AttendeeExtraInfo attendee={attendee} mb={4} />
                            </VStack>
                        ) : (
                            <Spinner label="Loading attendee profile, please wait" />
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Portal>
    );
}
