import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Center,
    FormControl,
    FormLabel,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Tab,
    Table,
    TableCaption,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useCallback, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import {
    Permission_Enum,
    useConferencePrepareJobSubscriptionSubscription,
    useCreateConferencePrepareJobMutation,
    useEventVonageControls_GetEventsQuery,
    useEventVonageControls_StopEventBroadcastMutation,
    useGetMediaLiveChannelsQuery,
} from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import FAIcon from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    mutation CreateConferencePrepareJob($conferenceId: uuid!) {
        insert_ConferencePrepareJob_one(object: { conferenceId: $conferenceId }) {
            id
            conferenceId
        }
    }

    subscription ConferencePrepareJobSubscription($conferenceId: uuid!) {
        ConferencePrepareJob(
            where: { conferenceId: { _eq: $conferenceId } }
            order_by: { createdAt: desc }
            limit: 10
        ) {
            id
            jobStatusName
            message
            updatedAt
            createdAt
            videoRenderJobs {
                id
                jobStatusName
                updated_at
                created_at
            }
        }
    }
`;

function PrepareJobsList({ conferenceId }: { conferenceId: string }): JSX.Element {
    const { data, loading, error } = useConferencePrepareJobSubscriptionSubscription({ variables: { conferenceId } });
    useQueryErrorToast(error, false);

    return loading && !data ? (
        <Spinner />
    ) : error ? (
        <>Error while loading list of jobs.</>
    ) : (
        <Table variant="simple">
            <TableCaption>Ongoing and past broadcast preparation jobs</TableCaption>
            <Thead>
                <Tr>
                    <Th>Started at</Th>
                    <Th>Status</Th>
                    <Th>Last updated</Th>
                </Tr>
            </Thead>
            <Tbody>
                {data?.ConferencePrepareJob.map((job) => (
                    <Tr key={job.id}>
                        <Td>{job.createdAt}</Td>
                        <Td>
                            <Tooltip label={job.message}>{job.jobStatusName}</Tooltip>
                        </Td>
                        <Td>{job.updatedAt}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}

gql`
    query GetMediaLiveChannels($conferenceId: uuid!) {
        Room(where: { mediaLiveChannel: {}, conferenceId: { _eq: $conferenceId } }) {
            mediaLiveChannel {
                cloudFrontDomain
                endpointUri
                id
            }
            name
            id
        }
    }
`;

function BroadcastRooms({ conferenceId }: { conferenceId: string }): JSX.Element {
    const { data, loading, error, refetch } = useGetMediaLiveChannelsQuery({ variables: { conferenceId } });
    useQueryErrorToast(error, false);

    const toStreamingEndpoint = useCallback((endpointUri: string, cloudFrontDomain: string): string => {
        const url = new URL(endpointUri);
        url.hostname = cloudFrontDomain;
        return url.toString();
    }, []);

    const [streamUri, setStreamUri] = useState<string | null>(null);
    const streamDisclosure = useDisclosure();

    return loading && !data ? (
        <Spinner />
    ) : error ? (
        <>Error while loading list of rooms.</>
    ) : (
        <>
            <Center>
                <Button aria-label="Refresh rooms" onClick={() => refetch()} size="sm">
                    <FAIcon icon="sync" iconStyle="s" />
                </Button>
            </Center>
            <Table variant="simple">
                <TableCaption>Rooms that are set up for broadcast</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>HLS URL</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {data?.Room.map((room) => (
                        <Tr key={room.id}>
                            <Td>{room.name}</Td>
                            <Td>
                                <Button
                                    isDisabled={!room.mediaLiveChannel}
                                    onClick={() => {
                                        if (room.mediaLiveChannel) {
                                            setStreamUri(
                                                toStreamingEndpoint(
                                                    room.mediaLiveChannel.endpointUri,
                                                    room.mediaLiveChannel.cloudFrontDomain
                                                )
                                            );
                                            streamDisclosure.onOpen();
                                        }
                                    }}
                                >
                                    Preview stream
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
            <Modal isCentered isOpen={streamDisclosure.isOpen} onClose={streamDisclosure.onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Stream preview</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {streamUri ? (
                            <>
                                <Text mb={2} fontSize="sm">
                                    {streamUri}
                                </Text>
                                <Box mb={2}>
                                    <ReactPlayer
                                        width="600"
                                        height="auto"
                                        url={streamUri}
                                        config={{
                                            file: {
                                                hlsOptions: {},
                                            },
                                        }}
                                        controls={true}
                                    />
                                </Box>
                            </>
                        ) : (
                            <Text>No stream preview available.</Text>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

gql`
    query EventVonageControls_GetEvents($conferenceId: uuid!) {
        Event(where: { conferenceId: { _eq: $conferenceId }, intendedRoomModeName: { _in: [Q_AND_A, PRESENTATION] } }) {
            id
            name
            contentGroup {
                id
                title
            }
        }
    }
    mutation EventVonageControls_StopEventBroadcast($eventId: uuid!) {
        stopEventBroadcast(eventId: $eventId) {
            broadcastsStopped
        }
    }
`;

function EventVonageControls({ conferenceId }: { conferenceId: string }): JSX.Element {
    const { data } = useEventVonageControls_GetEventsQuery({
        variables: {
            conferenceId,
        },
    });

    const [stopEventBroadcastMutation] = useEventVonageControls_StopEventBroadcastMutation();

    const toast = useToast();

    const options = useMemo(() => {
        return data?.Event.map(
            (event) =>
                (
                    <option key={event.id} value={event.id}>
                        {event.contentGroup ? `${event.contentGroup.title} (${event.name})` : event.name}
                    </option>
                ) ?? []
        );
    }, [data?.Event]);

    return (
        <Formik<{ eventId: string | null }>
            initialValues={{ eventId: null }}
            onSubmit={async (values) => {
                try {
                    if (!values.eventId) {
                        throw new Error("No event selected");
                    }
                    const result = await stopEventBroadcastMutation({
                        variables: {
                            eventId: values.eventId,
                        },
                    });

                    if (result.data?.stopEventBroadcast) {
                        toast({
                            status: "success",
                            title: `Stopped ${result.data.stopEventBroadcast.broadcastsStopped} broadcasts`,
                        });
                    } else {
                        throw new Error("No response from server");
                    }
                } catch (e) {
                    toast({
                        status: "error",
                        title: "Failed to stop broadcasts",
                        description: e.toString(),
                    });
                }
            }}
        >
            {({ isSubmitting }) => (
                <Form>
                    <Field name="eventId">
                        {({ field, form }: FieldProps<string>) => (
                            <FormControl isInvalid={!!form.errors.eventId && !!form.touched.eventId} isRequired>
                                <FormLabel htmlFor="eventId">Event</FormLabel>
                                <Select {...field} id="eventId" placeholder="Choose event">
                                    {options}
                                </Select>
                            </FormControl>
                        )}
                    </Field>
                    <Button type="submit" isLoading={isSubmitting} mt={4}>
                        Stop any ongoing broadcasts
                    </Button>
                </Form>
            )}
        </Formik>
    );
}

export default function ManageConferenceBroadcastPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage broadcasts at ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();
    const [create, { loading, error }] = useCreateConferencePrepareJobMutation();
    useQueryErrorToast(error, false);
    const toast = useToast();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Broadcasts
            </Heading>
            <Tabs>
                <TabList>
                    <Tab>Prepare broadcasts</Tab>
                    <Tab>RTMP broadcast recovery</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <Button
                            mt={5}
                            aria-label="Prepare broadcasts"
                            onClick={async () => {
                                await create({
                                    variables: {
                                        conferenceId: conference.id,
                                    },
                                });
                                toast({
                                    status: "success",
                                    description: "Started preparing broadcasts.",
                                });
                            }}
                        >
                            Prepare broadcasts
                        </Button>
                        {loading ? (
                            <Spinner />
                        ) : error ? (
                            <Text mt={3}>Failed to start broadcast preparation.</Text>
                        ) : (
                            <></>
                        )}
                        <Box mt={5}>
                            <PrepareJobsList conferenceId={conference.id} />
                        </Box>
                        <Box mt={5}>
                            <BroadcastRooms conferenceId={conference.id} />
                        </Box>
                    </TabPanel>
                    <TabPanel>
                        <EventVonageControls conferenceId={conference.id} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireAtLeastOnePermissionWrapper>
    );
}
