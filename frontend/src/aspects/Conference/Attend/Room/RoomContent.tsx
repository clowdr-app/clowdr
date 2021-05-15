import { Box, Heading, HStack, Tag, Text, useColorModeValue, Wrap, WrapItem } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useMemo } from "react";
import {
    Content_ItemType_Enum,
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment,
    Room_Mode_Enum,
} from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
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
    const bgColour = useColorModeValue("green.200", "green.700");
    const nextBgColour = useColorModeValue("gray.200", "gray.700");

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
            ) : undefined,
        [currentRoomEvent?.item?.videoElements, currentlySelectedVideoElementId, onChooseVideo]
    );

    const now5s = useRealTime(5000);

    // TODO: Exhibition layout if in exhibition mode, else content layout
    return (
        <Box flexGrow={1}>
            <RoomTitle roomDetails={roomDetails} />

            {currentRoomEvent ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                    <HStack justifyContent="space-between">
                        <Text>Started {formatRelative(Date.parse(currentRoomEvent.startTime), now5s)}</Text>
                        {currentEventRole ? (
                            <Tag colorScheme="green" my={2}>
                                {currentEventRole}
                            </Tag>
                        ) : undefined}
                    </HStack>
                    <Heading as="h3" textAlign="left" size="lg" mb={2}>
                        {currentRoomEvent.name}
                    </Heading>
                    {currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.Exhibition && currentRoomEvent.itemId ? (
                        <ItemElementsWrapper itemId={currentRoomEvent.itemId} linkToItem={true} />
                    ) : undefined}
                    {currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.VideoPlayer
                        ? currentEventVideosEl
                        : undefined}
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
                        <Text>Starts {formatRelative(Date.parse(nextRoomEvent.startTime), now5s)}</Text>
                        {nextEventRole ? (
                            <Tag colorScheme="gray" my={2} textTransform="none">
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
            roomDetails.originatingItem?.typeName !== Content_ItemType_Enum.Sponsor ? (
                <Text p={5}>No events in this room in the near future.</Text>
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
