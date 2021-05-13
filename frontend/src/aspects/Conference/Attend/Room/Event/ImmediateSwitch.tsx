import { gql } from "@apollo/client";
import { Button, FormControl, FormLabel, HStack, Select, useToast, VisuallyHidden } from "@chakra-ui/react";
import type {
    FillerImmediateSwitchData,
    RtmpPushImmediateSwitchData,
    VideoImmediateSwitchData,
} from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import { Field, FieldProps, Form, Formik } from "formik";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import { validate } from "uuid";
import {
    useImmediateSwitch_CreateMutation,
    useImmediateSwitch_GetElementsQuery,
} from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import FAIcon from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";

export function ImmediateSwitch({
    live,
    secondsUntilOffAir,
    eventId,
}: {
    live: boolean;
    secondsUntilOffAir: number;
    eventId: string;
}): JSX.Element {
    const toast = useToast();
    gql`
        query ImmediateSwitch_GetElements($eventId: uuid!) {
            schedule_Event_by_pk(id: $eventId) {
                id
                item {
                    id
                    elements(where: { typeName: { _eq: VIDEO_BROADCAST } }) {
                        id
                        name
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

    const { data: elementsData } = useImmediateSwitch_GetElementsQuery({
        variables: {
            eventId,
        },
    });

    const [createImmediateSwitch] = useImmediateSwitch_CreateMutation();

    const now = useRealTime(1000);
    const [lastSwitched, setLastSwitched] = useState<number>(0);
    const enableSwitchButton = now - lastSwitched > 5000;
    const conference = useConference();

    const options = useMemo(
        () => (
            <>
                <option key="rtmp_push" value="rtmp_push">
                    Live backstage (default)
                </option>
                <option key="filler" value="filler">
                    Filler video
                </option>
                {R.sort(
                    (a, b) => a.name.localeCompare(b.name),
                    elementsData?.schedule_Event_by_pk?.item?.elements ?? []
                ).map((element) => (
                    <option key={element.id} value={element.id}>
                        {element.name}
                    </option>
                ))}
            </>
        ),
        [elementsData?.schedule_Event_by_pk?.item?.elements]
    );

    const disable = useMemo(() => !live || secondsUntilOffAir < 20, [live, secondsUntilOffAir]);

    const form = useMemo(
        () => (
            <>
                <Formik<{ choice: string }>
                    initialValues={{
                        choice: "filler",
                    }}
                    onSubmit={async (values) => {
                        switch (values.choice) {
                            case "filler": {
                                try {
                                    const data: FillerImmediateSwitchData = {
                                        kind: "filler",
                                    };
                                    await createImmediateSwitch({
                                        variables: {
                                            data,
                                            eventId,
                                            conferenceId: conference.id,
                                        },
                                    });
                                } catch (err) {
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
                                    };
                                    await createImmediateSwitch({
                                        variables: {
                                            data,
                                            eventId,
                                            conferenceId: conference.id,
                                        },
                                    });
                                } catch (err) {
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
                                    const isValidUUID = validate(values.choice);
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
                                        elementId: values.choice,
                                    };
                                    await createImmediateSwitch({
                                        variables: {
                                            data,
                                            eventId,
                                            conferenceId: conference.id,
                                        },
                                    });
                                } catch (err) {
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
                    }}
                >
                    {({ dirty, ...props }) => (
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
                                        colorScheme="green"
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
            </>
        ),
        [createImmediateSwitch, disable, enableSwitchButton, eventId, now, options, toast]
    );

    return form;
}
