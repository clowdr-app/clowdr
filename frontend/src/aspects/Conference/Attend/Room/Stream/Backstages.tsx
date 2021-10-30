import {
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Heading,
    ListItem,
    Text,
    UnorderedList,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as portals from "react-reverse-portal";
import type { Room_EventSummaryFragment } from "../../../../../generated/graphql";
import { Room_Mode_Enum } from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import { useSharedRoomContext } from "../../../../Room/useSharedRoomContext";
import Backstage from "./Backstage";
import { isEventNow, isEventSoon } from "./isEventAt";

export default function Backstages({
    showBackstage,
    roomName,
    roomEvents,
    currentRoomEventId,
    nextRoomEventId,
    setWatchStreamForEventId,
    selectedEventId,
    onEventSelected,
    roomChatId,
    onLeave,
    hlsUri,
}: {
    showBackstage: boolean;
    roomName: string;
    roomEvents: readonly Room_EventSummaryFragment[];
    currentRoomEventId: string | null;
    nextRoomEventId: string | null;
    setWatchStreamForEventId: (eventId: string | null) => void;
    onEventSelected: React.Dispatch<React.SetStateAction<string | null>>;
    roomChatId: string | null | undefined;
    selectedEventId: string | null;
    onLeave?: () => void;
    hlsUri: string | undefined;
}): JSX.Element {
    const sortedEvents = useMemo(
        () =>
            R.sortWith(
                [R.ascend(R.prop("startTime"))],
                roomEvents.filter((event) =>
                    [Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(event.intendedRoomModeName)
                )
            ),
        [roomEvents]
    );

    const now = useRealTime(5000);

    const [activeEvents, setActiveEvents] = useState<Room_EventSummaryFragment[] | null>(null);
    useEffect(() => {
        const newActiveEvents = sortedEvents.filter(
            (x) => isEventNow(now, x) || isEventSoon(now, x) || selectedEventId === x.id
        );
        setActiveEvents((oldActiveEvents) =>
            !oldActiveEvents ||
            oldActiveEvents.length !== newActiveEvents.length ||
            newActiveEvents.some((x, idx) => idx >= oldActiveEvents.length || oldActiveEvents[idx].id !== x.id)
                ? newActiveEvents
                : oldActiveEvents
        );
    }, [now, selectedEventId, sortedEvents]);
    useEffect(() => {
        onEventSelected((oldId) => (!oldId && activeEvents?.length === 1 ? activeEvents[0].id : oldId));
    }, [activeEvents, onEventSelected]);

    const backstages = useMemo(() => {
        return (
            <Box mt={4} w="100%">
                {activeEvents?.map((x) => (
                    <Box key={x.id} mt={2} w="100%">
                        <Backstage
                            event={x}
                            selectedEventId={selectedEventId}
                            setSelectedEventId={onEventSelected}
                            roomChatId={roomChatId}
                            onLeave={onLeave}
                            hlsUri={hlsUri}
                        />
                    </Box>
                ))}

                {activeEvents?.length === 0 ? (
                    <Text textAlign="center" my={8} fontSize="lg">
                        No current or upcoming events in the backstage.
                    </Text>
                ) : undefined}
            </Box>
        );
    }, [activeEvents, roomChatId, selectedEventId, onEventSelected, onLeave, hlsUri]);

    const sharedRoomContext = useSharedRoomContext();

    const [isWatchStreamConfirmOpen, setIsWatchStreamConfirmOpen] = useState<boolean>(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const heading = useMemo(
        () => (
            <Heading as="h3" size="lg">
                {roomName}: Backstages
            </Heading>
        ),
        [roomName]
    );

    const welcomeInfo = useMemo(
        () => (
            <Alert status="info" my={4}>
                <AlertIcon />
                <Box flex="1">
                    <AlertTitle>Welcome to the backstages for {roomName}</AlertTitle>
                    <AlertDescription display="block">
                        <UnorderedList>
                            <ListItem>Each presentation and Q&amp;A event in this room has a backstage.</ListItem>
                            <ListItem>
                                Each backstage becomes available to join twenty minutes before the associated event
                                starts.
                            </ListItem>
                            <ListItem>Keep an eye on the chat for questions!</ListItem>
                        </UnorderedList>
                    </AlertDescription>
                </Box>
            </Alert>
        ),
        [roomName]
    );

    const videoChatForPermissionReset = useMemo(
        () =>
            showBackstage && !selectedEventId && sharedRoomContext ? (
                <Box display="none">
                    <portals.OutPortal
                        eventId={null}
                        node={sharedRoomContext.vonagePortalNode}
                        vonageSessionId=""
                        getAccessToken={() => ""}
                        disable={true}
                        isBackstageRoom={true}
                    />
                </Box>
            ) : undefined,
        [selectedEventId, sharedRoomContext, showBackstage]
    );

    const exitBackstageButton = useMemo(
        () =>
            !selectedEventId ? (
                currentRoomEventId || nextRoomEventId ? (
                    <>
                        <Button
                            variant="outline"
                            borderColor="DestructiveActionButton.600"
                            color="DestructiveActionButton.600"
                            onClick={() => setIsWatchStreamConfirmOpen(true)}
                            mt={4}
                        >
                            Watch live-stream
                        </Button>
                        <AlertDialog
                            isOpen={isWatchStreamConfirmOpen}
                            leastDestructiveRef={cancelRef}
                            onClose={() => setIsWatchStreamConfirmOpen(false)}
                        >
                            <AlertDialogOverlay>
                                <AlertDialogContent>
                                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                        Watch live-stream
                                    </AlertDialogHeader>

                                    <AlertDialogBody>
                                        Watching the stream while speaking is discouraged. The stream lag can cause a
                                        lot of confusion. Please be aware of the expected stream lag and avoid using a
                                        second device to watch the stream while you are active in the backstage.
                                    </AlertDialogBody>

                                    <AlertDialogFooter>
                                        <Button ref={cancelRef} onClick={() => setIsWatchStreamConfirmOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme="DestructiveActionButton"
                                            onClick={() =>
                                                currentRoomEventId
                                                    ? setWatchStreamForEventId(currentRoomEventId)
                                                    : setWatchStreamForEventId(nextRoomEventId)
                                            }
                                            ml={3}
                                        >
                                            Watch live-stream
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialogOverlay>
                        </AlertDialog>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        borderColor="DestructiveActionButton.600"
                        color="DestructiveActionButton.600"
                        onClick={() => setWatchStreamForEventId(nextRoomEventId)}
                        mt={4}
                    >
                        Exit backstage
                    </Button>
                )
            ) : undefined,
        [currentRoomEventId, isWatchStreamConfirmOpen, nextRoomEventId, selectedEventId, setWatchStreamForEventId]
    );

    return useMemo(
        () =>
            showBackstage ? (
                <Box pos="relative" display={showBackstage ? "block" : "none"} p={5}>
                    {heading}
                    {welcomeInfo}
                    {backstages}
                    {videoChatForPermissionReset}
                    {exitBackstageButton}
                </Box>
            ) : (
                <></>
            ),
        [videoChatForPermissionReset, backstages, heading, showBackstage, exitBackstageButton, welcomeInfo]
    );
}
