import { Alert, AlertIcon, Center, Tag, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment, Room_EventSummaryFragment } from "../../../../generated/graphql";
import { Content_ItemType_Enum, Schedule_Mode_Enum } from "../../../../generated/graphql";
import Card from "../../../Card";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRealTime } from "../../../Hooks/useRealTime";
import { ShufflePeriodBox } from "../../../ShuffleRooms/WaitingPage";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import { typeNameToDisplayName } from "../Content/ItemCard";
import { ItemElementsWrapper } from "../Content/ItemElements";
import { ExhibitionLayoutWrapper } from "../Exhibition/ExhibitionLayout";
import EventCard from "../Schedule/EventCard";
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
    const { conferencePath } = useAuthParameters();
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
        <VStack spacing={8} flexGrow={1} zIndex={1} py={4} px={[2, 2, 4]} w="100%">
            {currentRoomEvent ? (
                <VStack spacing={4} w="100%">
                    <Card
                        heading={currentRoomEvent.item?.title ?? currentRoomEvent.name}
                        subHeading={
                            currentRoomEvent.item ? typeNameToDisplayName(currentRoomEvent.item.typeName) : undefined
                        }
                        w="100%"
                        topLeftButton={{
                            colorScheme: "LiveActionButton",
                            iconStyle: "s",
                            label: `Started ${formatRelative(Date.parse(currentRoomEvent.scheduledStartTime), now5s)}`,
                            variant: "solid",
                            showLabel: true,
                        }}
                        editControls={[
                            ...(currentRoomEvent.scheduledEndTime
                                ? [
                                      <Tag key="ends-at" colorScheme="blue" borderRadius="full">
                                          Ends {formatRelative(Date.parse(currentRoomEvent.scheduledEndTime), now5s)}
                                      </Tag>,
                                  ]
                                : []),
                            ...(currentEventRole
                                ? [
                                      <Tag
                                          key="role"
                                          colorScheme="Room-CurrentEventRoleLabel"
                                          my={2}
                                          borderRadius="full"
                                      >
                                          You are {currentEventRole}
                                      </Tag>,
                                  ]
                                : []),
                        ]}
                    >
                        {currentRoomEvent.shufflePeriod &&
                        currentEventEndTime &&
                        currentEventEndTime - now5s > 1.5 * 60 * 1000 ? (
                            <Center>
                                <ShufflePeriodBox period={currentRoomEvent.shufflePeriod} />
                            </Center>
                        ) : (
                            <></>
                        )}
                        {currentRoomEvent.modeName === Schedule_Mode_Enum.VideoPlayer
                            ? currentEventVideosEl
                            : undefined}
                        {currentRoomEvent.modeName !== Schedule_Mode_Enum.Exhibition && currentRoomEvent.itemId ? (
                            <ItemElementsWrapper itemId={currentRoomEvent.itemId} noHeading />
                        ) : undefined}
                        {currentRoomEvent.exhibitionId ? (
                            <LinkButton
                                linkProps={{ target: "_blank" }}
                                to={`${conferencePath}/exhibition/${currentRoomEvent.exhibitionId}`}
                            >
                                Find out more
                            </LinkButton>
                        ) : currentRoomEvent.item ? (
                            <LinkButton
                                linkProps={{ target: "_blank" }}
                                to={`${conferencePath}/item/${currentRoomEvent.item.id}`}
                            >
                                Find out more
                            </LinkButton>
                        ) : undefined}
                        {currentRoomEvent.exhibitionId ? (
                            <ExhibitionLayoutWrapper exhibitionId={currentRoomEvent.exhibitionId} hideLiveViewButton />
                        ) : (
                            <></>
                        )}
                    </Card>
                    <VStack spacing={4} pt={2} pl={[6, 10, 14]} w="100%" alignItems="flex-end">
                        {currentRoomEvent.presentations.map((presentation) => (
                            <EventCard
                                key={presentation.id}
                                event={presentation}
                                includeAbstract={true}
                                includePresentations={false}
                                includeTypeName={true}
                                limitAbstractLengthTo={-1}
                                noLink
                                noAddToScheduleButton={true}
                            />
                        ))}
                    </VStack>
                </VStack>
            ) : (
                <></>
            )}
            {nextRoomEvent ? (
                <Card
                    heading={nextRoomEvent.item?.title ?? nextRoomEvent.name}
                    subHeading={nextRoomEvent.item ? typeNameToDisplayName(nextRoomEvent.item.typeName) : undefined}
                    w="100%"
                    topLeftButton={{
                        colorScheme: "blue",
                        iconStyle: "s",
                        label: `Starts ${formatRelative(Date.parse(nextRoomEvent.scheduledStartTime), now5s)}`,
                        variant: "solid",
                        showLabel: true,
                    }}
                    editControls={
                        nextEventRole
                            ? [
                                  <Tag key="role" colorScheme="Room-CurrentEventRoleLabel" my={2} borderRadius="full">
                                      You are {nextEventRole}
                                  </Tag>,
                              ]
                            : []
                    }
                >
                    {nextRoomEvent.itemId ? <ItemElementsWrapper itemId={nextRoomEvent.itemId} noHeading /> : <></>}
                    {nextRoomEvent.exhibitionId ? (
                        <LinkButton
                            linkProps={{ target: "_blank" }}
                            to={`${conferencePath}/exhibition/${nextRoomEvent.exhibitionId}`}
                        >
                            Find out more
                        </LinkButton>
                    ) : nextRoomEvent.item ? (
                        <LinkButton
                            linkProps={{ target: "_blank" }}
                            to={`${conferencePath}/item/${nextRoomEvent.item.id}`}
                        >
                            Find out more
                        </LinkButton>
                    ) : undefined}
                </Card>
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
                <Card
                    w="100%"
                    heading={roomDetails.item.title}
                    subHeading={typeNameToDisplayName(roomDetails.item.typeName)}
                    to={`${conferencePath}/item/${roomDetails.item.id}`}
                >
                    <ItemElementsWrapper itemId={roomDetails.item.id} noHeading />
                </Card>
            ) : (
                <></>
            )}

            {roomDetails.item?.typeName === Content_ItemType_Enum.Sponsor ? (
                <RoomSponsorContent
                    itemId={roomDetails.item.id}
                    roomId={roomDetails.id}
                    anyCurrentOrNextEvent={Boolean(currentRoomEvent || nextRoomEvent)}
                />
            ) : (
                <></>
            )}
        </VStack>
    );
}
