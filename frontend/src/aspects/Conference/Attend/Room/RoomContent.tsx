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
import { FormattedMessage } from "react-intl";
import type {
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment} from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    Room_Mode_Enum,
} from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import { ShufflePeriodBox } from "../../../ShuffleRooms/WaitingPage";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import { ItemElementsWrapper } from "../Content/ItemElements";
import { ExhibitionLayoutWrapper } from "../Exhibition/ExhibitionLayout";
import { RoomTitle } from "./RoomTitle";
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
                    <FormattedMessage
                        id="Conference.Attend.Room.NoVideosAdded"
                        defaultMessage="No videos have been added to this content item yet."
                    />
                </Alert>
            ),
        [currentRoomEvent?.item?.videoElements, currentlySelectedVideoElementId, onChooseVideo]
    );

    const now5s = useRealTime(5000);
    const currentEventEndTime = useMemo(
        () => currentRoomEvent?.endTime && Date.parse(currentRoomEvent.endTime),
        [currentRoomEvent?.endTime]
    );

    return (
        <Box flexGrow={1}>
            <RoomTitle roomDetails={roomDetails} />

            {currentRoomEvent ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                    <HStack justifyContent="space-between">
                        <Text>
                            <FormattedMessage
                                id="Conference.Attend.Room.StartedTime"
                                defaultMessage="Started {time}"
                                values={{
                                    time: formatRelative(Date.parse(currentRoomEvent.startTime), now5s)
                                }}
                            />
                        </Text>
                        {currentRoomEvent.endTime ? (
                            <Text>
                                <FormattedMessage
                                    id="Conference.Attend.Room.EndsTime"
                                    defaultMessage="Ends {time}"
                                    values={{
                                        time: formatRelative(Date.parse(currentRoomEvent.endTime), now5s)
                                    }}
                                />
                            </Text>
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
                    {currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.VideoPlayer
                        ? currentEventVideosEl
                        : undefined}
                    {currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.Exhibition && currentRoomEvent.itemId ? (
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
                <Box backgroundColor={nextBgColour} borderRadius={5} px={5} py={3} my={5}>
                    <Heading as="h3" textAlign="left" size="lg" mb={1}>
                        {nextRoomEvent.name}
                    </Heading>
                    <HStack justifyContent="space-between" mb={2}>
                        <Text>
                            <FormattedMessage
                                id="Conference.Attend.Room.StartsTime"
                                defaultMessage="Starts {time}"
                                values={{
                                    time: formatRelative(Date.parse(nextRoomEvent.startTime), now5s)
                                }}
                            />
                        </Text>
                        {nextEventRole ? (
                            <Tag colorScheme="Room-NextEventRoleLabel" my={2} textTransform="none">
                                <FormattedMessage
                                    id="Conference.Attend.Room.YourRole"
                                    defaultMessage="You are {role}"
                                    values={{
                                        role: nextEventRole
                                    }}
                                />
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
            roomDetails.originatingItem?.typeName !== Content_ItemType_Enum.Sponsor ? (
                <Text p={5}>
                    <FormattedMessage
                        id="Conference.Attend.Room.NoEventsNextHour"
                        defaultMessage="No events in this room in the next hour."
                    />
                </Text>
            ) : (
                <></>
            )}

            {roomDetails.originatingItem?.id &&
            roomDetails.originatingItem.typeName !== Content_ItemType_Enum.Sponsor ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                    <ItemElementsWrapper itemId={roomDetails.originatingItem.id} linkToItem={true} />
                </Box>
            ) : (
                <></>
            )}

            {roomDetails.originatingItem?.typeName === Content_ItemType_Enum.Sponsor ? (
                <RoomSponsorContent itemId={roomDetails.originatingItem.id} />
            ) : (
                <></>
            )}
        </Box>
    );
}
