import {
    Alert,
    AlertIcon,
    Box,
    Center,
    Heading,
    HStack,
    Tag,
    Text,
    useColorModeValue,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment, Room_EventSummaryFragment } from "../../../../generated/graphql";
import { Content_ItemType_Enum, Schedule_Mode_Enum } from "../../../../generated/graphql";
import { useRealTime } from "../../../Hooks/useRealTime";
import { ShufflePeriodBox } from "../../../ShuffleRooms/WaitingPage";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import { ItemElementsWrapper } from "../Content/ItemElements";
import { ExhibitionLayoutWrapper } from "../Exhibition/ExhibitionLayout";
import { RoomSponsorContent } from "./Sponsor/RoomSponsorContent";
import { VideoElementButton } from "./Video/VideoElementButton";

export function RoomContent({
    currentRoomEvent,
    nextRoomEvent,
    roomDetails,
    currentlySelectedVideoElementId,
    onChooseVideo,
}: {
    currentRoomEvent: Room_EventSummaryFragment | null;
    nextRoomEvent: Room_EventSummaryFragment | null;
    roomDetails: RoomPage_RoomDetailsFragment;
    currentlySelectedVideoElementId?: string;
    onChooseVideo?: (elementId: string) => void;
}): JSX.Element {
    const bgColour = useColorModeValue(
        "Room.currentEventBackgroundColor-light",
        "Room.currentEventBackgroundColor-dark"
    );
    const nextBgColour = useColorModeValue("Room.nextEventBackgroundColor-light", "Room.nextEventBackgroundColor-dark");

    const currentRegistrant = useCurrentRegistrant();

    const currentEventRole = useMemo(
        () =>
            currentRoomEvent?.eventPeople.find(
                (p) => p.person.registrantId && p.person.registrantId === currentRegistrant.id
            )?.roleName,
        [currentRegistrant, currentRoomEvent?.eventPeople]
    );
    const nextEventRole = useMemo(
        () =>
            nextRoomEvent?.eventPeople.find(
                (p) => p.person.registrantId && p.person.registrantId === currentRegistrant.id
            )?.roleName,
        [currentRegistrant, nextRoomEvent?.eventPeople]
    );

    const currentEventVideosEl = useMemo(
        () =>
            currentRoomEvent?.item?.videoElements?.length ? (
                <Wrap role="list" justify="center">
                    {currentRoomEvent.item.videoElements.map((element) => (
                        <WrapItem key={element.id} role="listitem" w="30ch" overflow="hidden" p="3px">
                            <VideoElementButton
                                isSelected={currentlySelectedVideoElementId === element.id}
                                elementName={element.name}
                                onClick={() => onChooseVideo?.(element.id)}
                            />
                        </WrapItem>
                    ))}
                </Wrap>
            ) : (
                <Alert status="warning" mt={3}>
                    <AlertIcon />
                    No videos have been added to this content item yet.
                </Alert>
            ),
        [currentRoomEvent?.item?.videoElements, currentlySelectedVideoElementId, onChooseVideo]
    );

    const now5s = useRealTime(5000);
    const currentEventEndTime = useMemo(
        () => currentRoomEvent?.scheduledEndTime && Date.parse(currentRoomEvent.scheduledEndTime),
        [currentRoomEvent?.scheduledEndTime]
    );

    return (
        <Box flexGrow={1} zIndex={1} px={[2, 2, 4]}>
            {currentRoomEvent ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={2}>
                    <HStack justifyContent="space-between">
                        <Text>Started {formatRelative(Date.parse(currentRoomEvent.scheduledStartTime), now5s)}</Text>
                        {currentRoomEvent.scheduledEndTime ? (
                            <Text>Ends {formatRelative(Date.parse(currentRoomEvent.scheduledEndTime), now5s)}</Text>
                        ) : undefined}
                        {currentEventRole ? (
                            <Tag colorScheme="Room-CurrentEventRoleLabel" my={2}>
                                {currentEventRole}
                            </Tag>
                        ) : undefined}
                    </HStack>
                    <Heading as="h3" textAlign="left" size="lg" mb={2}>
                        {currentRoomEvent.name}
                    </Heading>
                    {currentRoomEvent.shufflePeriod &&
                    currentEventEndTime &&
                    currentEventEndTime - now5s > 1.5 * 60 * 1000 ? (
                        <Center>
                            <ShufflePeriodBox period={currentRoomEvent.shufflePeriod} />
                        </Center>
                    ) : (
                        <></>
                    )}
                    {currentRoomEvent.modeName === Schedule_Mode_Enum.VideoPlayer ? currentEventVideosEl : undefined}
                    {currentRoomEvent.modeName !== Schedule_Mode_Enum.Exhibition && currentRoomEvent.itemId ? (
                        <ItemElementsWrapper itemId={currentRoomEvent.itemId} linkToItem={true} />
                    ) : undefined}
                    {currentRoomEvent.exhibitionId ? (
                        <ExhibitionLayoutWrapper
                            exhibitionId={currentRoomEvent.exhibitionId}
                            hideLiveViewButton={true}
                        />
                    ) : (
                        <></>
                    )}
                </Box>
            ) : (
                <></>
            )}
            {nextRoomEvent ? (
                <Box backgroundColor={nextBgColour} borderRadius={5} px={5} py={3} my={2}>
                    <Heading as="h3" textAlign="left" size="lg" mb={1}>
                        {nextRoomEvent.name}
                    </Heading>
                    <HStack justifyContent="space-between" mb={2}>
                        <Text>Starts {formatRelative(Date.parse(nextRoomEvent.scheduledStartTime), now5s)}</Text>
                        {nextEventRole ? (
                            <Tag colorScheme="Room-NextEventRoleLabel" my={2} textTransform="none">
                                You are {nextEventRole}
                            </Tag>
                        ) : undefined}
                    </HStack>
                    {nextRoomEvent?.itemId ? (
                        <ItemElementsWrapper itemId={nextRoomEvent.itemId} linkToItem={true} />
                    ) : (
                        <></>
                    )}
                </Box>
            ) : (
                <></>
            )}

            {!currentRoomEvent &&
            !nextRoomEvent &&
            roomDetails.isProgramRoom &&
            roomDetails.item?.typeName !== Content_ItemType_Enum.Sponsor ? (
                <Text p={5}>No events in this room in the next hour.</Text>
            ) : (
                <></>
            )}

            {roomDetails.item?.id && roomDetails.item.typeName !== Content_ItemType_Enum.Sponsor ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={2}>
                    <ItemElementsWrapper itemId={roomDetails.item.id} linkToItem={true} />
                </Box>
            ) : (
                <></>
            )}

            {roomDetails.item?.typeName === Content_ItemType_Enum.Sponsor ? (
                <RoomSponsorContent itemId={roomDetails.item.id} />
            ) : (
                <></>
            )}
        </Box>
    );
}
