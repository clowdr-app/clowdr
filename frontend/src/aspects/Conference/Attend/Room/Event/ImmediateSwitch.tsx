import { gql } from "@apollo/client";
import {
    Button,
    FormControl,
    FormLabel,
    HStack,
    Select,
    Spinner,
    Text,
    useToast,
    VisuallyHidden,
} from "@chakra-ui/react";
import {
    FillerImmediateSwitchData,
    ImmediateSwitchData,
    RtmpPushImmediateSwitchData,
    VideoImmediateSwitchData,
} from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { Field, FieldProps, Form, Formik } from "formik";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import { validate } from "uuid";
import {
    useImmediateSwitch_CreateMutation,
    useImmediateSwitch_GetElementsQuery,
    useImmediateSwitch_GetLatestQuery,
} from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import FAIcon from "../../../../Icons/FAIcon";

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
        query ImmediateSwitch_GetLatest($eventId: uuid!) {
            video_ImmediateSwitch(
                order_by: { executedAt: desc_nulls_last }
                where: { eventId: { _eq: $eventId }, executedAt: { _is_null: false } }
                limit: 1
            ) {
                id
                data
                executedAt
            }
        }

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

        mutation ImmediateSwitch_Create($data: jsonb!, $eventId: uuid!) {
            insert_video_ImmediateSwitch_one(object: { data: $data, eventId: $eventId }) {
                id
            }
        }
    `;

    const {
        data: latestImmediateSwitchData,
        loading: latestImmediateSwitchLoading,
        error: latestImmediateSwitchError,
    } = useImmediateSwitch_GetLatestQuery({
        variables: {
            eventId,
        },
        pollInterval: 10000,
    });

    const { data: elementsData } = useImmediateSwitch_GetElementsQuery({
        variables: {
            eventId,
        },
    });

    const [createImmediateSwitch] = useImmediateSwitch_CreateMutation();

    const latestSwitch = useMemo(() => {
        if (!latestImmediateSwitchData?.video_ImmediateSwitch?.length) {
            return "Playing live presentation";
        }

        const transformed = plainToClass(ImmediateSwitchData, {
            type: "switch",
            data: latestImmediateSwitchData.video_ImmediateSwitch[0].data,
        });

        const errors = validateSync(transformed);
        if (errors.length) {
            console.error("Invalid immediate switch", { errors, data: transformed });
            return "Could not determine current input";
        }

        const data = transformed.data;

        switch (data.kind) {
            case "filler":
                return "Playing filler video";
            case "rtmp_push":
                return "Playing live presentation";
            case "video": {
                const elementName = elementsData?.schedule_Event_by_pk?.item?.elements?.find(
                    (element) => element.id === data.elementId
                )?.name;
                return `Playing ${elementName ? `'${elementName}'` : "unknown video"}`;
            }
        }
    }, [elementsData?.schedule_Event_by_pk?.item?.elements, latestImmediateSwitchData?.video_ImmediateSwitch]);

    const now = useRealTime(1000);
    const [lastSwitched, setLastSwitched] = useState<number>(0);
    const enableSwitchButton = now - lastSwitched > 5000;

    const options = useMemo(
        () => (
            <>
                <option key="filler" value="filler">
                    Filler video
                </option>
                <option key="rtmp_push" value="rtmp_push">
                    Live presentation
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

    const form = useMemo(
        () => (
            <>
                {latestImmediateSwitchError ? (
                    <>Error loading input switch data.</>
                ) : latestImmediateSwitchLoading ? (
                    <Spinner />
                ) : undefined}
                <Text>{latestSwitch}</Text>
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
                                                <Select {...{ ...field }} placeholder="Choose input" isRequired>
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
                                        isDisabled={!props.isValid}
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
        [
            createImmediateSwitch,
            enableSwitchButton,
            eventId,
            latestImmediateSwitchError,
            latestImmediateSwitchLoading,
            latestSwitch,
            now,
            options,
            toast,
        ]
    );

    return live && secondsUntilOffAir > 20 ? form : <></>;
}
