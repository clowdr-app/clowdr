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
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import { Markdown } from "../../../Chakra/Markdown";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import PronounList from "../../../Pronouns/PronounList";
import type { Registrant } from "../../useCurrentRegistrant";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import RegistrantExtraInfo from "../Profile/RegistrantExtraInfo";
import RegistrantItems from "../Profile/RegistrantItems";
import CreateDMButton from "./CreateDMButton";

export default function ProfileModal({
    registrant,
    isOpen,
    onClose,
}: {
    registrant: Registrant | null;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const mCurrentRegistrant = useMaybeCurrentRegistrant();

    return (
        <Portal>
            <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="xl">
                <ModalOverlay />
                <ModalContent px={2} pb={4}>
                    <ModalHeader>
                        {registrant ? (
                            <>
                                <Heading as="h4" size="sm" textAlign="left" mr={8}>
                                    {registrant.displayName}
                                    <br />
                                    {registrant.profile.affiliation ? (
                                        <Text as="span" fontStyle="italic" fontSize="0.9em">
                                            ({registrant.profile.affiliation})
                                        </Text>
                                    ) : undefined}
                                </Heading>
                            </>
                        ) : undefined}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody px={0}>
                        {registrant ? (
                            <VStack spacing={4}>
                                <HStack justifyContent="flex-start" w="100%" px={2} alignItems="flex-start">
                                    <VStack alignItems="flex-start">
                                        {registrant.profile.pronouns ? (
                                            <PronounList pronouns={registrant.profile.pronouns} px={2} />
                                        ) : undefined}
                                        {registrant.profile.affiliation ? (
                                            <Text>
                                                {registrant.profile.affiliationURL ? (
                                                    <>
                                                        <FAIcon iconStyle="s" icon="link" fontSize="0.7rem" />
                                                        &nbsp;
                                                        <Link
                                                            isExternal
                                                            href={`${
                                                                !registrant.profile.affiliationURL
                                                                    .toLowerCase()
                                                                    .startsWith("http://") &&
                                                                !registrant.profile.affiliationURL
                                                                    .toLowerCase()
                                                                    .startsWith("https://")
                                                                    ? "https://"
                                                                    : ""
                                                            }${registrant.profile.affiliationURL}`}
                                                        >
                                                            {registrant.profile.affiliation}
                                                        </Link>
                                                    </>
                                                ) : (
                                                    registrant.profile.affiliation
                                                )}
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                    <Spacer />
                                    <VStack alignItems="stretch">
                                        {mCurrentRegistrant &&
                                        mCurrentRegistrant?.id !== registrant.id &&
                                        registrant.userId ? (
                                            <CreateDMButton registrantId={registrant.id} onCreate={onClose} />
                                        ) : undefined}
                                        <LinkButton
                                            to={`${conferencePath}/profile/view/${registrant.id}`}
                                            size="sm"
                                            variant="outline"
                                            colorScheme="SecondaryActionButton"
                                        >
                                            <FAIcon iconStyle="s" icon="link" mr={2} />
                                            View profile
                                        </LinkButton>
                                    </VStack>
                                </HStack>
                                {registrant.profile.photoURL_350x350 ? (
                                    <Image
                                        maxW={350}
                                        maxH={350}
                                        w="100%"
                                        h="auto"
                                        aria-describedby={`registrant-trigger-${registrant.id}`}
                                        src={registrant.profile.photoURL_350x350}
                                    />
                                ) : undefined}
                                {registrant.profile.badges ? (
                                    <BadgeList badges={registrant.profile.badges} px={2} />
                                ) : undefined}
                                {registrant.profile.bio ? (
                                    <Box py={0} px={2} w="100%">
                                        <Markdown restrictHeadingSize>{registrant.profile.bio}</Markdown>
                                    </Box>
                                ) : undefined}
                                <RegistrantExtraInfo registrant={registrant} mb={4} px={2} maxW="100%" />
                                {registrant ? (
                                    <VStack spacing={0} w="100%">
                                        <RegistrantItems registrantId={registrant.id} />
                                    </VStack>
                                ) : undefined}
                            </VStack>
                        ) : (
                            <Spinner label="Loading registrant profile, please wait" />
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Portal>
    );
}
