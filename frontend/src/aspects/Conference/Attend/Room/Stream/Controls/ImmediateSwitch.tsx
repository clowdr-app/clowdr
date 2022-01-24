import { gql } from "@apollo/client";
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
import type {
    FillerImmediateSwitchData,
    RtmpPushImmediateSwitchData,
    VideoImmediateSwitchData,
} from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import type { FieldProps} from "formik";
import { Field, Form, Formik } from "formik";
import * as R from "ramda";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { validate } from "uuid";
import type {
    RoomEventDetailsFragment} from "../../../../../../generated/graphql";
import {
    useImmediateSwitch_CreateMutation,
    useImmediateSwitch_GetElementsQuery,
    useLiveIndicator_GetLatestQuery,
} from "../../../../../../generated/graphql";
import { useRealTime } from "../../../../../Generic/useRealTime";
import FAIcon from "../../../../../Icons/FAIcon";
import { useConference } from "../../../../useConference";
import { FormattedMessage, useIntl } from "react-intl";

gql`
    query ImmediateSwitch_GetElements($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            item {
                id
                title
                elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE, VIDEO_PREPUBLISH] } }) {
                    id
                    name
                }
            }
            exhibition {
                id
                items {
                    id
                    item {
                        id
                        title
                        elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE, VIDEO_PREPUBLISH] } }) {
                            id
                            name
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

export function ImmediateSwitch({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const toast = useToast();
    const intl = useIntl();

    const startTime = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const endTime = useMemo(() => Date.parse(event.endTime), [event.endTime]);
    const now = useRealTime(1000);
    const offsetNow = now + 2000; // adjust for expected RTMP delay
    const live = offsetNow >= startTime && offsetNow <= endTime;
    const secondsUntilOffAir = (endTime - offsetNow) / 1000;

    const { data: elementsData } = useImmediateSwitch_GetElementsQuery({
        variables: {
            eventId: event.id,
        },
    });

    const [createImmediateSwitch] = useImmediateSwitch_CreateMutation();
    const liveIndicatorLatest = useLiveIndicator_GetLatestQuery({
        skip: true,
    });

    const [lastSwitched, setLastSwitched] = useState<number>(0);
    const enableSwitchButton = now - lastSwitched > 5000;
    const conference = useConference();

    const options = useMemo(
        () => (
            <>
                <option key="rtmp_push" value="rtmp_push">
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.ImmediateSwitch.LiveBackstage"
                        defaultMessage="Live backstage (default)"
                    />
                </option>
                <option key="filler" value="filler">
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.ImmediateSwitch.FillerVideo"
                        defaultMessage="Filler video"
                    />
                </option>
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
        [elementsData?.schedule_Event_by_pk?.item, elementsData?.schedule_Event_by_pk?.exhibition?.items]
    );

    const disable = useMemo(() => !live || secondsUntilOffAir < 20, [live, secondsUntilOffAir]);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const performSwitch = useCallback(
        async (choice: string) => {
            switch (choice) {
                case "filler": {
                    try {
                        const data: FillerImmediateSwitchData = {
                            kind: "filler",
                        };
                        await createImmediateSwitch({
                            variables: {
                                data,
                                eventId: event.id,
                                conferenceId: conference.id,
                            },
                        });
                        await liveIndicatorLatest.refetch({
                            eventId: event.id,
                        });
                    } catch (err: any) {
                        toast({
                            status: "error",
                            title: intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Controls.ImmediateSwitch.ErrorFiller', defaultMessage: "Could not switch to filler video" }),
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
                        };
                        await createImmediateSwitch({
                            variables: {
                                data,
                                eventId: event.id,
                                conferenceId: conference.id,
                            },
                        });
                    } catch (err: any) {
                        toast({
                            status: "error",
                            title: intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Controls.ImmediateSwitch.ErrorSwitchLive', defaultMessage: "Could not switch to live presentation" }),
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
                                title: intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Controls.ImmediateSwitch.ErrorSwitchVideo', defaultMessage: "Could not switch to chosen video" }),
                                description: "Invalid ID",
                            });
                            return;
                        }
                        const data: VideoImmediateSwitchData = {
                            kind: "video",
                            elementId: choice,
                        };
                        await createImmediateSwitch({
                            variables: {
                                data,
                                eventId: event.id,
                                conferenceId: conference.id,
                            },
                        });
                    } catch (err: any) {
                        toast({
                            status: "error",
                            title: intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Controls.ImmediateSwitch.ErrorSwitchVideoImmediate', defaultMessage: "Could not switch to chosen video" }),
                            description: err.message,
                        });
                        return;
                    }
                    break;
                }
            }
            setLastSwitched(now);
        },
        [conference.id, createImmediateSwitch, event.id, liveIndicatorLatest, now, toast]
    );

    const cancelRef = useRef<HTMLButtonElement>(null);
    const [switchAction, setSwitchAction] = useState<string | null>(null);

    const form = useMemo(
        () => (
            <>
                <Formik<{ choice: string }>
                    initialValues={{
                        choice: "filler",
                    }}
                    onSubmit={async (values) => {
                        setSwitchAction(values.choice);
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
                        <AlertDialogHeader>
                            <FormattedMessage
                                id="Conference.Attend.Room.Stream.Controls.ImmediateSwitch.SwitchInput"
                                defaultMessage="Switch livestream input"
                            />
                        </AlertDialogHeader>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            <FormattedMessage
                                id="Conference.Attend.Room.Stream.Controls.ImmediateSwitch.ChangeConfirmation"
                                defaultMessage="Are you sure you want to change what is being streamed? The audience will see this change."
                            />
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                <FormattedMessage
                                    id="Conference.Attend.Room.Stream.Controls.ImmediateSwitch.No"
                                    defaultMessage="No"
                                />
                            </Button>
                            <Button
                                colorScheme="ConfirmButton"
                                ml={3}
                                isLoading={!switchAction}
                                onClick={async () => {
                                    if (switchAction) {
                                        setSwitchAction(null);
                                        await performSwitch(switchAction);
                                        onClose();
                                    }
                                }}
                            >
                                <FormattedMessage
                                    id="Conference.Attend.Room.Stream.Controls.ImmediateSwitch.Yes"
                                    defaultMessage="Yes"
                                />
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        ),
        [disable, enableSwitchButton, isOpen, onClose, onOpen, options, performSwitch, switchAction]
    );

    return form;
}
