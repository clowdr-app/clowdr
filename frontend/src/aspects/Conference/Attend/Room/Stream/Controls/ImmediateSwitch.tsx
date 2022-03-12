import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Select,
    useDisclosure,
    useToast,
    VisuallyHidden,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import type {
    FillerImmediateSwitchData,
    RtmpPushImmediateSwitchData,
    VideoImmediateSwitchData,
} from "@midspace/shared-types/video/immediateSwitchData";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import * as R from "ramda";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import { useContextSelector } from "use-context-selector";
import { validate } from "uuid";
import type {
    LiveIndicator_GetLatestQuery,
    LiveIndicator_GetLatestQueryVariables,
} from "../../../../../../generated/graphql";
import {
    LiveIndicator_GetLatestDocument,
    useImmediateSwitch_CreateMutation,
    useImmediateSwitch_GetElementsQuery,
} from "../../../../../../generated/graphql";
import FAIcon from "../../../../../Chakra/FAIcon";
import { makeContext } from "../../../../../GQL/make-context";
import { useRealTime } from "../../../../../Hooks/useRealTime";
import { useConference } from "../../../../useConference";
import { BackstageContext } from "../BackstageContext";

gql`
    query ImmediateSwitch_GetElements($eventId: uuid!) @cached {
        schedule_Event_by_pk(id: $eventId) {
            id
            itemId
            item {
                id
                title
                elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE, VIDEO_PREPUBLISH] } }) {
                    id
                    name
                    itemId
                    typeName
                }
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
                        id
                        title
                        elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE, VIDEO_PREPUBLISH] } }) {
                            id
                            name
                            itemId
                            typeName
                        }
                    }
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

export function ImmediateSwitch(): JSX.Element {
    const toast = useToast();
    const event = useContextSelector(BackstageContext, (state) => state.event);

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

    const [lastSwitched, setLastSwitched] = useState<number>(0);
    const enableSwitchButton = now - lastSwitched > 5000;
    const conference = useConference();

    const options = useMemo(
        () => (
            <>
                <option key="rtmp_push_event" value="rtmp_push:rtmpEvent">
                    Live backstage (default)
                </option>
                {elementsData?.schedule_Event_by_pk?.room?.rtmpInput?.id ? (
                    <option key="rtmp_push_external" value="rtmp_push:rtmpRoom">
                        Hybrid Room (External RTMP input)
                    </option>
                ) : undefined}
                {R.sort(
                    (a, b) => a.title.localeCompare(b.title),
                    elementsData?.schedule_Event_by_pk?.item && elementsData?.schedule_Event_by_pk?.exhibition?.items
                        ? [
                              elementsData.schedule_Event_by_pk.item,
                              ...elementsData.schedule_Event_by_pk.exhibition.items.map((x) => x.item),
                          ]
                        : elementsData?.schedule_Event_by_pk?.item
                        ? [elementsData.schedule_Event_by_pk.item]
                        : elementsData?.schedule_Event_by_pk?.exhibition?.items
                        ? [...elementsData.schedule_Event_by_pk.exhibition.items.map((x) => x.item)]
                        : []
                ).flatMap((item) =>
                    R.sort((a, b) => a.name.localeCompare(b.name), item.elements).map((element) => (
                        <option key={element.id} value={element.id}>
                            {item.title}: {element.name}
                        </option>
                    ))
                )}
            </>
        ),
        [
            elementsData?.schedule_Event_by_pk?.room?.rtmpInput?.id,
            elementsData?.schedule_Event_by_pk?.item,
            elementsData?.schedule_Event_by_pk?.exhibition?.items,
        ]
    );

    const disable = useMemo(() => !live || secondsUntilOffAir < 20, [live, secondsUntilOffAir]);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const client = useClient();
    const performSwitch = useCallback(
        async (choice: string, source?: "rtmpEvent" | "rtmpRoom") => {
            switch (choice) {
                case "filler": {
                    try {
                        const data: FillerImmediateSwitchData = {
                            kind: "filler",
                        };
                        await createImmediateSwitch({
                            data,
                            eventId: event.id,
                            conferenceId: conference.id,
                        });
                        await client
                            .query<LiveIndicator_GetLatestQuery, LiveIndicator_GetLatestQueryVariables>(
                                LiveIndicator_GetLatestDocument,
                                {
                                    eventId: event.id,
                                }
                            )
                            .toPromise();
                    } catch (err: any) {
                        toast({
                            status: "error",
                            title: "Could not switch to filler video",
                            description: err.message,
                        });
                        return;
                    }
                    break;
                }
                case "rtmp_push": {
                    try {
                        const data: RtmpPushImmediateSwitchData = {
                            kind: "rtmp_push",
                            source,
                        };
                        await createImmediateSwitch({
                            data,
                            eventId: event.id,
                            conferenceId: conference.id,
                        });
                        await client
                            .query<LiveIndicator_GetLatestQuery, LiveIndicator_GetLatestQueryVariables>(
                                LiveIndicator_GetLatestDocument,
                                {
                                    eventId: event.id,
                                }
                            )
                            .toPromise();
                    } catch (err: any) {
                        toast({
                            status: "error",
                            title: "Could not switch to live presentation",
                            description: err.message,
                        });
                        return;
                    }
                    break;
                }
                default: {
                    try {
                        const isValidUUID = validate(choice);
                        if (!isValidUUID) {
                            toast({
                                status: "error",
                                title: "Could not switch to chosen video",
                                description: "Invalid ID",
                            });
                            return;
                        }
                        const data: VideoImmediateSwitchData = {
                            kind: "video",
                            elementId: choice,
                        };
                        await createImmediateSwitch({
                            data,
                            eventId: event.id,
                            conferenceId: conference.id,
                        });
                        await client
                            .query<LiveIndicator_GetLatestQuery, LiveIndicator_GetLatestQueryVariables>(
                                LiveIndicator_GetLatestDocument,
                                {
                                    eventId: event.id,
                                }
                            )
                            .toPromise();
                    } catch (err: any) {
                        toast({
                            status: "error",
                            title: "Could not switch to chosen video",
                            description: err.message,
                        });
                        return;
                    }
                    break;
                }
            }
            setLastSwitched(now);
        },
        [conference.id, createImmediateSwitch, event.id, client, now, toast]
    );

    const cancelRef = useRef<HTMLButtonElement>(null);
    const [switchAction, setSwitchAction] = useState<string | null>(null);
    const [switchSource, setSwitchSource] = useState<"rtmpEvent" | "rtmpRoom" | null>(null);

    const form = useMemo(
        () => (
            <>
                <Formik<{ choice: string }>
                    initialValues={{
                        choice: "filler",
                    }}
                    onSubmit={async (values) => {
                        const parts = values.choice.split(":");
                        const choice = parts[0] ?? null;
                        const source = parts[1] ?? null;
                        setSwitchAction(choice);
                        setSwitchSource(source as "rtmpEvent" | "rtmpRoom" | null);
                        onOpen();
                    }}
                >
                    {({ ...props }) => (
                        <>
                            <Form>
                                <HStack>
                                    <Field name="choice">
                                        {({ field }: FieldProps<string>) => (
                                            <FormControl>
                                                <VisuallyHidden>
                                                    <FormLabel htmlFor="choice">Livestream input</FormLabel>
                                                </VisuallyHidden>
                                                <Select
                                                    {...{ ...field }}
                                                    placeholder="Choose input"
                                                    isRequired
                                                    isDisabled={disable || !enableSwitchButton}
                                                >
                                                    {options}
                                                </Select>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Button
                                        mt={4}
                                        colorScheme="PrimaryActionButton"
                                        isLoading={props.isSubmitting || !enableSwitchButton}
                                        type="submit"
                                        isDisabled={!props.isValid || disable}
                                        aria-label="Switch livestream input"
                                        title="Switch livestream input"
                                        size="sm"
                                    >
                                        <FAIcon icon="play-circle" iconStyle="s" />
                                    </Button>
                                </HStack>
                            </Form>
                        </>
                    )}
                </Formik>
                <AlertDialog
                    motionPreset="slideInBottom"
                    leastDestructiveRef={cancelRef}
                    onClose={onClose}
                    isOpen={isOpen}
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
                            <Button ref={cancelRef} onClick={onClose}>
                                No
                            </Button>
                            <Button
                                colorScheme="ConfirmButton"
                                ml={3}
                                isLoading={!switchAction}
                                onClick={async () => {
                                    if (switchAction) {
                                        setSwitchAction(null);
                                        setSwitchSource(null);
                                        await performSwitch(switchAction, switchSource ?? undefined);
                                        onClose();
                                    }
                                }}
                            >
                                Yes
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        ),
        [disable, enableSwitchButton, isOpen, onClose, onOpen, options, performSwitch, switchAction, switchSource]
    );

    return form;
}
