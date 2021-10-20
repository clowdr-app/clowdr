import {
    Box,
    Button,
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
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useCreateDmMutation } from "../../../../generated/graphql";
import BadgeList from "../../../Badges/BadgeList";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useMaybeGlobalChatState } from "../../../Chat/GlobalChatStateProvider";
import FAIcon from "../../../Icons/FAIcon";
import PronounList from "../../../Pronouns/PronounList";
import { Markdown } from "../../../Text/Markdown";
import { useConference } from "../../useConference";
import type { Registrant} from "../../useCurrentRegistrant";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import RegistrantExtraInfo from "../Profile/RegistrantExtraInfo";
import RegistrantItems from "../Profile/RegistrantItems";

export default function ProfileModal({
    registrant,
    isOpen,
    onClose,
}: {
    registrant: Registrant | null;
    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const mCurrentRegistrant = useMaybeCurrentRegistrant();
    const mChatState = useMaybeGlobalChatState();

    const [createDmMutation, { loading: creatingDM }] = useCreateDmMutation();
    const toast = useToast();
    const createDM = useCallback(async () => {
        if (registrant && mChatState?.openChatInSidebar) {
            try {
                const result = await createDmMutation({
                    variables: {
                        registrantIds: [registrant.id],
                        conferenceId: conference.id,
                    },
                });
                if (result.errors || !result.data?.createRoomDm) {
                    console.error("Failed to create DM", result.errors);
                    throw new Error("Failed to create DM");
                } else {
                    if (result.data.createRoomDm.message !== "DM already exists") {
                        toast({
                            title: result.data.createRoomDm.message ?? "Created new DM",
                            status: "success",
                        });
                    }

                    mChatState.openChatInSidebar(result.data.createRoomDm.chatId);

                    onClose();
                }
            } catch (e) {
                toast({
                    title: "Could not create DM",
                    status: "error",
                });
                console.error("Could not create DM", e);
            }
        }
    }, [registrant, mChatState, createDmMutation, conference.id, onClose, toast]);

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
                                            <Button
                                                onClick={createDM}
                                                isLoading={creatingDM}
                                                colorScheme="PrimaryActionButton"
                                                size="sm"
                                            >
                                                <FAIcon icon="comment" iconStyle="s" mr={3} /> Chat
                                            </Button>
                                        ) : undefined}
                                        <LinkButton
                                            to={`/conference/${conference.slug}/profile/view/${registrant.id}`}
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
