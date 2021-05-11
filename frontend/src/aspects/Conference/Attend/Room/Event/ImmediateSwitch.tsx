import { gql } from "@apollo/client";
import { Button, FormControl, FormLabel, Select, Spinner, Text, useToast } from "@chakra-ui/react";
import {
    FillerImmediateSwitchData,
    ImmediateSwitchData,
    RtmpPushImmediateSwitchData,
    VideoImmediateSwitchData,
} from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useMemo } from "react";
import { validate } from "uuid";
import {
    useImmediateSwitch_CreateMutation,
    useImmediateSwitch_GetElementsQuery,
    useImmediateSwitch_GetLatestQuery,
} from "../../../../../generated/graphql";

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
                    elements {
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
            data: latestImmediateSwitchData.video_ImmediateSwitch[0].data,
        });

        if (validateSync(transformed).length) {
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

    const options = useMemo(
        () => (
            <>
                <option key="filler" value="filler">
                    Filler video
                </option>
                <option key="rtmp_push" value="rtmp_push">
                    Live presentation
                </option>
                {elementsData?.schedule_Event_by_pk?.item?.elements.map((element) => (
                    <option key={element.id} value={element.id}>
                        {element.name}
                    </option>
                )) ?? undefined}
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
                                }
                                break;
                            }
                        }
                        //
                    }}
                >
                    {({ dirty, ...props }) => (
                        <>
                            <Form>
                                <Field name="choice">
                                    {({ field }: FieldProps<string>) => (
                                        <FormControl>
                                            <FormLabel htmlFor="choice">Livestream input</FormLabel>
                                            <Select {...{ ...field }} placeholder="Choose input" isRequired>
                                                {options}
                                            </Select>
                                        </FormControl>
                                    )}
                                </Field>
                                <Button
                                    mt={4}
                                    colorScheme="green"
                                    isLoading={props.isSubmitting}
                                    type="submit"
                                    isDisabled={!props.isValid}
                                    aria-label="Switch livestream input"
                                >
                                    Switch input
                                </Button>
                            </Form>
                        </>
                    )}
                </Formik>
            </>
        ),
        [
            createImmediateSwitch,
            eventId,
            latestImmediateSwitchError,
            latestImmediateSwitchLoading,
            latestSwitch,
            options,
            toast,
        ]
    );

    return live && secondsUntilOffAir > 20 ? (
        form
    ) : (
        <>
            <Text>Cannot change the livestream input at the moment.</Text>
        </>
    );
}
