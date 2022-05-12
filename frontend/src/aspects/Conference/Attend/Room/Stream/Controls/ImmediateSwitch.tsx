import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    ListItem,
    Popover,
    PopoverAnchor,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    Text,
    UnorderedList,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import type { ImmediateSwitchData } from "@midspace/shared-types/video/immediateSwitchData";
import * as R from "ramda";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    Event_EventVonageSessionFragment,
    ImmediateSwitchItemFragment,
    LiveIndicator_GetLatestQuery,
    LiveIndicator_GetLatestQueryVariables,
    Room_EventSummaryFragment,
} from "../../../../../../generated/graphql";
import {
    LiveIndicator_GetLatestDocument,
    useImmediateSwitch_CreateMutation,
    useImmediateSwitch_GetElementsQuery,
} from "../../../../../../generated/graphql";
import Card from "../../../../../Card";
import extractActualError from "../../../../../GQL/ExtractActualError";
import { makeContext } from "../../../../../GQL/make-context";
import { useRealTime } from "../../../../../Hooks/useRealTime";
import { useConference } from "../../../../useConference";
import { ControlBarButton } from "../../Vonage/ControlBar/ControlBarButton";

gql`
    fragment ImmediateSwitchItem on content_Item {
        id
        title
        elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE, VIDEO_PREPUBLISH] } }) {
            id
            name
            itemId
            typeName
        }
    }

    query ImmediateSwitch_GetElements($eventId: uuid!) @cached {
        schedule_Event_by_pk(id: $eventId) {
            id
            itemId
            item {
                ...ImmediateSwitchItem
            }
            roomId
            room {
                id
                rtmpInput {
                    id
                    roomId
                }
            }
            exhibitionId
            exhibition {
                id
                items {
                    id
                    itemId
                    item {
                        ...ImmediateSwitchItem
                    }
                }
            }
            presentations {
                id
                item {
                    ...ImmediateSwitchItem
                }
            }
        }
    }

    mutation ImmediateSwitch_Create($data: jsonb!, $eventId: uuid!, $conferenceId: uuid!) {
        insert_video_ImmediateSwitch_one(object: { data: $data, eventId: $eventId, conferenceId: $conferenceId }) {
            id
        }
    }
`;

export function ImmediateSwitch({
    event,
}: {
    event: Room_EventSummaryFragment & Event_EventVonageSessionFragment;
}): JSX.Element {
    const toast = useToast();

    const scheduledStartTime = useMemo(() => Date.parse(event.scheduledStartTime), [event.scheduledStartTime]);
    const scheduledEndTime = useMemo(() => Date.parse(event.scheduledEndTime), [event.scheduledEndTime]);
    const now = useRealTime(1000);
    const offsetNow = now + 2000; // adjust for expected RTMP delay
    const live = offsetNow >= scheduledStartTime && offsetNow <= scheduledEndTime;
    const secondsUntilOffAir = (scheduledEndTime - offsetNow) / 1000;

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: event.roomId,
            }),
        [event.roomId]
    );
    const [{ data: elementsData }] = useImmediateSwitch_GetElementsQuery({
        variables: {
            eventId: event.id,
        },
        context,
    });

    const [, createImmediateSwitch] = useImmediateSwitch_CreateMutation();

    const [_lastSwitched, setLastSwitched] = useState<number>(0);
    // const enableSwitchButton = now - lastSwitched > 5000;
    const conference = useConference();

    const disable = useMemo(() => !live || secondsUntilOffAir < 20, [live, secondsUntilOffAir]);

    const popover = useDisclosure();
    const confirmationDialog = useDisclosure();

    const client = useClient();
    const performSwitch = useCallback(
        async (immediateSwitchData: ImmediateSwitchData) => {
            try {
                const result = await createImmediateSwitch({
                    data: immediateSwitchData,
                    eventId: event.id,
                    conferenceId: conference.id,
                });
                if (result.error) {
                    const error = extractActualError(result.error);
                    throw new Error(error);
                }
                await client
                    .query<LiveIndicator_GetLatestQuery, LiveIndicator_GetLatestQueryVariables>(
                        LiveIndicator_GetLatestDocument,
                        {
                            eventId: event.id,
                        }
                    )
                    .toPromise();
            } catch (err) {
                toast({
                    status: "error",
                    title: "Could not switch livestream feed",
                    description: err instanceof Error ? err.message : undefined,
                });
            }
            setLastSwitched(now);
        },
        [conference.id, createImmediateSwitch, event.id, client, now, toast]
    );

    const cancelRef = useRef<HTMLButtonElement>(null);
    const [switchData, setSwitchData] = useState<ImmediateSwitchData | null>(null);
    const startSwitch = useCallback(
        (immediateSwitchData: ImmediateSwitchData) => {
            setSwitchData(immediateSwitchData);
            confirmationDialog.onOpen();
            popover.onClose();
        },
        [confirmationDialog, popover]
    );

    return (
        <>
            <AlertDialog
                motionPreset="slideInBottom"
                leastDestructiveRef={cancelRef}
                onClose={confirmationDialog.onClose}
                isOpen={confirmationDialog.isOpen}
                isCentered
            >
                <AlertDialogOverlay />

                <AlertDialogContent>
                    <AlertDialogHeader>Switch livestream input</AlertDialogHeader>
                    <AlertDialogCloseButton />
                    <AlertDialogBody>
                        Are you sure you want to change what is being streamed? The audience will see this change.
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={confirmationDialog.onClose}>
                            No
                        </Button>
                        <Button
                            colorScheme="ConfirmButton"
                            ml={3}
                            isLoading={!switchData}
                            onClick={async () => {
                                if (switchData) {
                                    setSwitchData(null);
                                    await performSwitch(switchData);
                                    confirmationDialog.onClose();
                                }
                            }}
                        >
                            Yes
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Popover isOpen={popover.isOpen} onClose={popover.onClose} placement="top">
                <PopoverAnchor>
                    <ControlBarButton
                        label="Change livestream source"
                        icon="play-circle"
                        isVisible={true}
                        isActive={false}
                        isEnabled={!disable}
                        onClick={() => popover.onToggle()}
                    />
                </PopoverAnchor>
                <PopoverContent>
                    <PopoverHeader fontWeight="semibold">Change live-stream source</PopoverHeader>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody>
                        <UnorderedList
                            listStyleType="none"
                            marginInlineStart={0}
                            my={2}
                            spacing={2}
                            flex={1}
                            overflowY="auto"
                            maxH="50vh"
                        >
                            <ListItem key="rtmp_push_event">
                                <Card
                                    heading="Live backstage"
                                    rightButton={{
                                        icon: "play",
                                        iconStyle: "s",
                                        label: "Switch to live backstage",
                                        colorScheme: "blue",
                                        variant: "solid",
                                        onClick: () => {
                                            startSwitch({
                                                kind: "rtmp_push",
                                                source: "rtmpEvent",
                                            });
                                        },
                                    }}
                                >
                                    <Text fontSize="sm">
                                        The live backstage room that you are currently connected to.
                                    </Text>
                                </Card>
                            </ListItem>
                            <ListItem key="filler_video">
                                <Card
                                    heading="Filler video"
                                    rightButton={{
                                        icon: "play",
                                        iconStyle: "s",
                                        label: "Switch to filler video",
                                        colorScheme: "blue",
                                        variant: "solid",
                                        onClick: () => {
                                            startSwitch({
                                                kind: "filler",
                                            });
                                        },
                                    }}
                                >
                                    <Text fontSize="sm">A generic video to fill gaps in the live-stream.</Text>
                                </Card>
                            </ListItem>
                            {elementsData?.schedule_Event_by_pk?.room?.rtmpInput?.id ? (
                                <ListItem key="rtmp_push_external" value="rtmp_push:rtmpRoom">
                                    <Card
                                        heading="Hybrid Room (External RTMP input)"
                                        rightButton={{
                                            icon: "play",
                                            iconStyle: "s",
                                            label: "Switch to external RTMP input",
                                            colorScheme: "blue",
                                            variant: "solid",
                                            onClick: () => {
                                                startSwitch({
                                                    kind: "rtmp_push",
                                                    source: "rtmpRoom",
                                                });
                                            },
                                        }}
                                    >
                                        <Text fontSize="sm">The room&apos;s external RTMP input.</Text>
                                    </Card>
                                </ListItem>
                            ) : undefined}
                            {R.sort((a, b) => a.title.localeCompare(b.title), [
                                ...(elementsData?.schedule_Event_by_pk?.item
                                    ? [elementsData.schedule_Event_by_pk.item]
                                    : []),
                                ...(elementsData?.schedule_Event_by_pk?.exhibition
                                    ? elementsData.schedule_Event_by_pk.exhibition.items.map((x) => x.item)
                                    : []),
                                ...(elementsData?.schedule_Event_by_pk?.presentations
                                    ? elementsData.schedule_Event_by_pk.presentations.map((x) => x.item)
                                    : []),
                            ] as ImmediateSwitchItemFragment[]).flatMap((item) =>
                                R.sort((a, b) => a.name.localeCompare(b.name), item.elements).map((element) => (
                                    <ListItem key={element.id}>
                                        <Card
                                            subHeading={item.title}
                                            heading={element.name}
                                            rightButton={{
                                                icon: "play",
                                                iconStyle: "s",
                                                label: `Switch to video '${item.title}: ${element.name}'`,
                                                colorScheme: "blue",
                                                variant: "solid",
                                                onClick: () => {
                                                    startSwitch({
                                                        kind: "video",
                                                        elementId: element.id,
                                                    });
                                                },
                                            }}
                                        />
                                    </ListItem>
                                ))
                            )}
                        </UnorderedList>
                    </PopoverBody>
                </PopoverContent>
            </Popover>
        </>
    );
}
