import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    chakra,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Select,
    Switch,
    Text,
    Tooltip,
    useColorMode,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { ContinuationTo } from "@midspace/shared-types/continuation";
import { ContinuationDefaultFor, ContinuationType, NavigationView } from "@midspace/shared-types/continuation";
import { gql } from "@urql/core";
import { format } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import Color from "tinycolor2";
import { useClient } from "urql";
import type {
    CreateContinuationModal_EventsQuery,
    CreateContinuationModal_EventsQueryVariables,
    CreateContinuationModal_ExhibitionsQuery,
    CreateContinuationModal_ExhibitionsQueryVariables,
    CreateContinuationModal_ItemsQuery,
    CreateContinuationModal_ItemsQueryVariables,
    CreateContinuationModal_ProfileQuery,
    CreateContinuationModal_ProfileQueryVariables,
    CreateContinuationModal_RoomsQuery,
    CreateContinuationModal_RoomsQueryVariables,
    CreateContinuationModal_ShufflePeriodsQuery,
    CreateContinuationModal_ShufflePeriodsQueryVariables,
    CreateContinuationModal_TagsQuery,
    CreateContinuationModal_TagsQueryVariables,
} from "../../../../generated/graphql";
import {
    CreateContinuationModal_EventsDocument,
    CreateContinuationModal_ExhibitionsDocument,
    CreateContinuationModal_ItemsDocument,
    CreateContinuationModal_ProfileDocument,
    CreateContinuationModal_RoomsDocument,
    CreateContinuationModal_ShufflePeriodsDocument,
    CreateContinuationModal_TagsDocument,
    useContinuationsEditor_InsertMutation,
} from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useConference } from "../../useConference";

function LazySelectFromQuery({
    fetch,
    value,
    onChange,
    visible,
    label,
}: {
    fetch: () => Promise<{ key: string; value: string }[]>;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    label: string;
}): JSX.Element {
    const [options, setOptions] = useState<null | { key: string; value: string }[]>(null);

    useEffect(() => {
        if (visible && options === null) {
            (async () => {
                const opts = await fetch();
                opts.sort((x, y) => x.value.localeCompare(y.value));
                setOptions(opts);
                if (value === "") {
                    onChange(opts[0].key);
                }
            })();
        }
    }, [fetch, visible, options, onChange, value]);

    const optionEls = useMemo(
        () =>
            options?.map((opt) => (
                <option key={opt.key} value={opt.key}>
                    {opt.value}
                </option>
            )),
        [options]
    );

    return visible ? (
        <FormControl>
            <FormLabel>{label}</FormLabel>
            <Select
                value={value}
                onChange={(ev) => {
                    onChange(ev.target.value);
                }}
            >
                {optionEls}
            </Select>
        </FormControl>
    ) : (
        <></>
    );
}

gql`
    query CreateContinuationModal_Rooms($conferenceId: uuid!) {
        room_Room(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
            conferenceId
        }
    }

    query CreateContinuationModal_Events($conferenceId: uuid!) {
        schedule_Event(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            conferenceId
            name
            scheduledStartTime
            scheduledEndTime
            modeName
            itemId
            item {
                id
                title
            }
            exhibitionId
            exhibition {
                id
                name
            }
            shufflePeriodId
            shufflePeriod {
                id
                name
            }
        }
    }

    query CreateContinuationModal_Items($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            title
            conferenceId
        }
    }

    query CreateContinuationModal_Exhibitions($conferenceId: uuid!) {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
            conferenceId
        }
    }

    query CreateContinuationModal_ShufflePeriods($conferenceId: uuid!) {
        room_ShufflePeriod(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
            conferenceId
        }
    }

    query CreateContinuationModal_Tags($conferenceId: uuid!) {
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
            conferenceId
        }
    }

    query CreateContinuationModal_Profile($conferenceId: uuid!) {
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            displayName
            conferenceId
        }
    }
`;

export default function CreateContinuationModal({
    from,
    defaultPriority,
    forceActiveChoice,
    eventItemId,
}: {
    from: { eventId: string } | { shufflePeriodId: string };
    defaultPriority: number;
    forceActiveChoice?: boolean;
    eventItemId?: string;
}): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const client = useClient();

    const leastDestructiveRef = useRef<HTMLButtonElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const { onOpen, onClose, isOpen } = useDisclosure();

    const [to, setTo] = useState<ContinuationTo>(
        "eventId" in from
            ? {
                  type: ContinuationType.AutoDiscussionRoom,
                  id: eventItemId ?? "",
              }
            : {
                  type: ContinuationType.ShufflePeriod,
                  id: "shufflePeriodId" in from ? from.shufflePeriodId : "",
              }
    );
    const typeOptions = useMemo(() => {
        return [
            <option key={ContinuationType.URL} value={ContinuationType.URL}>
                URL
            </option>,
            <option key={ContinuationType.Room} value={ContinuationType.Room}>
                Room
            </option>,
            <option key={ContinuationType.Event} value={ContinuationType.Event}>
                Event
            </option>,
            <option key={ContinuationType.AutoDiscussionRoom} value={ContinuationType.AutoDiscussionRoom}>
                Automatic Discussion Room
            </option>,
            <option key={ContinuationType.Item} value={ContinuationType.Item}>
                Item
            </option>,
            <option key={ContinuationType.Exhibition} value={ContinuationType.Exhibition}>
                Exhibition
            </option>,
            <option key={ContinuationType.ShufflePeriod} value={ContinuationType.ShufflePeriod}>
                Shuffle Period
            </option>,
            <option key={ContinuationType.Profile} value={ContinuationType.Profile}>
                Profile
            </option>,
            <option key={ContinuationType.OwnProfile} value={ContinuationType.OwnProfile}>
                User&apos;s Own Profile
            </option>,
            <option key={ContinuationType.NavigationView} value={ContinuationType.NavigationView}>
                A Navigation View
            </option>,
            <option key={ContinuationType.ConferenceLandingPage} value={ContinuationType.ConferenceLandingPage}>
                Conference Landing Page
            </option>,
        ];
    }, []);
    const viewOptions = useMemo(() => {
        return [
            <option key={NavigationView.LiveProgramRooms} value={NavigationView.LiveProgramRooms}>
                Live Program Rooms
            </option>,
            <option key={NavigationView.HappeningSoon} value={NavigationView.HappeningSoon}>
                Happening Soon
            </option>,
            <option key={NavigationView.Tags} value={NavigationView.Tags}>
                Tags
            </option>,
            <option key={NavigationView.Exhibitions} value={NavigationView.Exhibitions}>
                Exhibitions
            </option>,
            <option key={NavigationView.Schedule} value={NavigationView.Schedule}>
                Schedule
            </option>,
            <option key={NavigationView.SocialRooms} value={NavigationView.SocialRooms}>
                Social Rooms
            </option>,
            <option key={NavigationView.People} value={NavigationView.People}>
                People
            </option>,
            <option key={NavigationView.ShufflePeriods} value={NavigationView.ShufflePeriods}>
                Shuffle Periods
            </option>,
            <option key={NavigationView.MyBackstages} value={NavigationView.MyBackstages}>
                My Backstages
            </option>,
        ];
    }, []);
    const toTypeSelect = useMemo(
        () => (
            <FormControl>
                <FormLabel>To</FormLabel>
                <Select
                    value={to.type}
                    onChange={(ev) => {
                        const v = ev.target.value;
                        switch (v) {
                            case ContinuationType.URL:
                                setTo({
                                    type: ContinuationType.URL,
                                    text: "",
                                    url: "",
                                });
                                break;
                            case ContinuationType.Room:
                                setTo({
                                    type: ContinuationType.Room,
                                    id: "",
                                });
                                break;
                            case ContinuationType.Event:
                                setTo({
                                    type: ContinuationType.Event,
                                    id: "",
                                });
                                break;
                            case ContinuationType.AutoDiscussionRoom:
                                setTo({
                                    type: ContinuationType.AutoDiscussionRoom,
                                    id: eventItemId ?? "",
                                });
                                break;
                            case ContinuationType.Item:
                                setTo({
                                    type: ContinuationType.Item,
                                    id: eventItemId ?? "",
                                });
                                break;
                            case ContinuationType.Exhibition:
                                setTo({
                                    type: ContinuationType.Exhibition,
                                    id: "",
                                });
                                break;
                            case ContinuationType.ShufflePeriod:
                                setTo({
                                    type: ContinuationType.ShufflePeriod,
                                    id: "",
                                });
                                break;
                            case ContinuationType.Profile:
                                setTo({
                                    type: ContinuationType.Profile,
                                    id: "",
                                });
                                break;
                            case ContinuationType.OwnProfile:
                                setTo({
                                    type: ContinuationType.OwnProfile,
                                });
                                break;
                            case ContinuationType.NavigationView:
                                setTo({
                                    type: ContinuationType.NavigationView,
                                    view: NavigationView.LiveProgramRooms,
                                });
                                break;
                            case ContinuationType.ConferenceLandingPage:
                                setTo({
                                    type: ContinuationType.ConferenceLandingPage,
                                });
                                break;
                        }
                    }}
                >
                    {typeOptions}
                </Select>
                <FormHelperText>Where to direct people.</FormHelperText>
            </FormControl>
        ),
        [to.type, typeOptions, eventItemId]
    );
    const toViewSelect = useMemo(
        () =>
            to.type === ContinuationType.NavigationView ? (
                <FormControl>
                    <FormLabel>Navigation view</FormLabel>
                    <Select
                        value={to.view}
                        onChange={(ev) => {
                            const v = ev.target.value;
                            switch (v) {
                                case NavigationView.LiveProgramRooms:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.LiveProgramRooms,
                                    });
                                    break;
                                case NavigationView.HappeningSoon:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.HappeningSoon,
                                    });
                                    break;
                                case NavigationView.Tags:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.Tags,
                                        tagId: null,
                                    });
                                    break;
                                case NavigationView.Exhibitions:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.Exhibitions,
                                    });
                                    break;
                                case NavigationView.Schedule:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.Schedule,
                                    });
                                    break;
                                case NavigationView.SocialRooms:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.SocialRooms,
                                    });
                                    break;
                                case NavigationView.People:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.People,
                                    });
                                    break;
                                case NavigationView.ShufflePeriods:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.ShufflePeriods,
                                    });
                                    break;
                                case NavigationView.MyBackstages:
                                    setTo({
                                        type: ContinuationType.NavigationView,
                                        view: NavigationView.MyBackstages,
                                    });
                                    break;
                            }
                        }}
                    >
                        {viewOptions}
                    </Select>
                </FormControl>
            ) : undefined,
        [viewOptions, to]
    );
    const toURLInput = useMemo(
        () =>
            to.type === ContinuationType.URL ? (
                <FormControl>
                    <FormLabel>URL</FormLabel>
                    <Input
                        type="url"
                        value={to.url}
                        onChange={(ev) => {
                            setTo({
                                type: ContinuationType.URL,
                                url: ev.target.value,
                                text: to.text,
                            });
                        }}
                    />
                </FormControl>
            ) : undefined,
        [to]
    );
    const toTextInput = useMemo(
        () =>
            to.type === ContinuationType.URL ? (
                <FormControl>
                    <FormLabel>Label</FormLabel>
                    <Input
                        value={to.text}
                        onChange={(ev) => {
                            setTo({
                                type: ContinuationType.URL,
                                url: to.url,
                                text: ev.target.value,
                            });
                        }}
                    />
                </FormControl>
            ) : undefined,
        [to]
    );

    const toRoomsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<CreateContinuationModal_RoomsQuery, CreateContinuationModal_RoomsQueryVariables>(
                            CreateContinuationModal_RoomsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return (
                        data.data?.room_Room.map((x) => ({
                            key: x.id,
                            value: x.name,
                        })) ?? []
                    );
                }}
                value={to.type === ContinuationType.Room ? to.id : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.Room,
                        id,
                    });
                }}
                visible={to.type === ContinuationType.Room}
                label="Room"
            />
        ),
        [client, conference.id, subconferenceId, to]
    );

    const toEventsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<CreateContinuationModal_EventsQuery, CreateContinuationModal_EventsQueryVariables>(
                            CreateContinuationModal_EventsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return (
                        data.data?.schedule_Event.map((x) => ({
                            key: x.id,
                            value: `${format(new Date(x.scheduledStartTime), "d MMMM HH:mm")} - ${x.name}${
                                x.item
                                    ? `: ${x.item.title}`
                                    : x.exhibition
                                    ? `: ${x.exhibition.name}`
                                    : x.shufflePeriod
                                    ? `: ${x.shufflePeriod.name}`
                                    : ""
                            }`,
                        })) ?? []
                    );
                }}
                value={to.type === ContinuationType.Event ? to.id : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.Event,
                        id,
                    });
                }}
                visible={to.type === ContinuationType.Event}
                label="Event"
            />
        ),
        [client, conference.id, subconferenceId, to]
    );
    const toItemsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<CreateContinuationModal_ItemsQuery, CreateContinuationModal_ItemsQueryVariables>(
                            CreateContinuationModal_ItemsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return (
                        data.data?.content_Item.map((x) => ({
                            key: x.id,
                            value: x.title,
                        })) ?? []
                    );
                }}
                value={to.type === ContinuationType.Item ? to.id : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.Item,
                        id,
                    });
                }}
                visible={to.type === ContinuationType.Item}
                label="Item"
            />
        ),
        [to, client, conference.id, subconferenceId]
    );
    const toAutoItemsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<CreateContinuationModal_ItemsQuery, CreateContinuationModal_ItemsQueryVariables>(
                            CreateContinuationModal_ItemsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return [
                        {
                            key: "00-match-event",
                            value: "(Match item of event)",
                        },
                        ...(data.data?.content_Item.map((x) => ({
                            key: x.id,
                            value: x.title,
                        })) ?? []),
                    ];
                }}
                value={to.type === ContinuationType.AutoDiscussionRoom ? to.id ?? "00-match-event" : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.AutoDiscussionRoom,
                        id: id === "00-match-event" ? null : id,
                    });
                }}
                visible={to.type === ContinuationType.AutoDiscussionRoom}
                label="Item"
            />
        ),
        [to, client, conference.id, subconferenceId]
    );

    const toExhibitionsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<
                            CreateContinuationModal_ExhibitionsQuery,
                            CreateContinuationModal_ExhibitionsQueryVariables
                        >(
                            CreateContinuationModal_ExhibitionsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return (
                        data.data?.collection_Exhibition.map((x) => ({
                            key: x.id,
                            value: x.name,
                        })) ?? []
                    );
                }}
                value={to.type === ContinuationType.Exhibition ? to.id : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.Exhibition,
                        id,
                    });
                }}
                visible={to.type === ContinuationType.Exhibition}
                label="Exhibition"
            />
        ),
        [to, client, conference.id, subconferenceId]
    );

    const toShufflePeriodsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<
                            CreateContinuationModal_ShufflePeriodsQuery,
                            CreateContinuationModal_ShufflePeriodsQueryVariables
                        >(
                            CreateContinuationModal_ShufflePeriodsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return (
                        data.data?.room_ShufflePeriod.map((x) => ({
                            key: x.id,
                            value: x.name,
                        })) ?? []
                    );
                }}
                value={to.type === ContinuationType.ShufflePeriod ? to.id : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.ShufflePeriod,
                        id,
                    });
                }}
                visible={to.type === ContinuationType.ShufflePeriod}
                label="Shuffle period"
            />
        ),
        [to, client, conference.id, subconferenceId]
    );
    const toProfileSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<CreateContinuationModal_ProfileQuery, CreateContinuationModal_ProfileQueryVariables>(
                            CreateContinuationModal_ProfileDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return (
                        data.data?.registrant_Registrant.map((x) => ({
                            key: x.id,
                            value: x.displayName,
                        })) ?? []
                    );
                }}
                value={to.type === ContinuationType.Profile ? to.id : ""}
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.Profile,
                        id,
                    });
                }}
                visible={to.type === ContinuationType.Profile}
                label="Profile"
            />
        ),
        [to, client, conference.id, subconferenceId]
    );

    const toTagsSelect = useMemo(
        () => (
            <LazySelectFromQuery
                fetch={async () => {
                    const data = await client
                        .query<CreateContinuationModal_TagsQuery, CreateContinuationModal_TagsQueryVariables>(
                            CreateContinuationModal_TagsDocument,
                            {
                                conferenceId: conference.id,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: subconferenceId
                                            ? HasuraRoleName.SubconferenceOrganizer
                                            : HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    return [
                        {
                            key: "",
                            value: "(None selected)",
                        },
                        ...(data.data?.collection_Tag.map((x) => ({
                            key: x.id,
                            value: x.name,
                        })) ?? []),
                    ];
                }}
                value={
                    to.type === ContinuationType.NavigationView && to.view === NavigationView.Tags ? to.tagId ?? "" : ""
                }
                onChange={(id) => {
                    setTo({
                        type: ContinuationType.NavigationView,
                        view: NavigationView.Tags,
                        tagId: id === "" ? null : id,
                    });
                }}
                visible={to.type === ContinuationType.NavigationView && to.view === NavigationView.Tags}
                label="Tag (optional)"
            />
        ),
        [client, conference.id, to, subconferenceId]
    );

    const [defaultFor, setDefaultFor] = useState<ContinuationDefaultFor>(ContinuationDefaultFor.None);
    const defaultForOptions = useMemo(
        () => [
            <option key={ContinuationDefaultFor.None} value={ContinuationDefaultFor.None}>
                (None)
            </option>,
            <option key={ContinuationDefaultFor.All} value={ContinuationDefaultFor.All}>
                Everyone
            </option>,
            <option key={ContinuationDefaultFor.Presenters} value={ContinuationDefaultFor.Presenters}>
                Presenters
            </option>,
            <option key={ContinuationDefaultFor.Chairs} value={ContinuationDefaultFor.Chairs}>
                Chairs
            </option>,
            <option key={ContinuationDefaultFor.Viewers} value={ContinuationDefaultFor.Viewers}>
                Viewers
            </option>,
        ],
        []
    );
    const toDefaultForSelect = useMemo(
        () => (
            <FormControl>
                <FormLabel>Default for</FormLabel>
                <Select
                    value={defaultFor}
                    onChange={(ev) => {
                        setDefaultFor(ev.target.value as any);
                    }}
                >
                    {defaultForOptions}
                </Select>
                <FormHelperText>
                    Optionally, make this the default-selected continuation for the specified people.
                </FormHelperText>
            </FormControl>
        ),
        [defaultFor, defaultForOptions]
    );

    const [isActiveChoice, setIsActiveChoice] = useState<boolean>(forceActiveChoice ?? false);
    useEffect(() => {
        if (forceActiveChoice !== undefined) {
            setIsActiveChoice(forceActiveChoice);
        }
    }, [forceActiveChoice]);
    const activeChoiceSwitch = useMemo(
        () => (
            <FormControl isDisabled={forceActiveChoice !== undefined}>
                <FormLabel>Is active choice?</FormLabel>
                <HStack fontSize="sm">
                    <chakra.span>No</chakra.span>
                    <Switch
                        isChecked={isActiveChoice}
                        isDisabled={forceActiveChoice !== undefined}
                        onChange={(ev) => {
                            setIsActiveChoice(ev.target.checked);
                        }}
                    />
                    <chakra.span>Yes</chakra.span>
                </HStack>
                <FormHelperText as={VStack} alignItems="flex-start">
                    {forceActiveChoice !== undefined ? (
                        <Text>This option can be edited by toggling it on the event settings.</Text>
                    ) : undefined}
                    <Text>
                        An active choice requires a person to select an option before continuing to use Midspace. A
                        passive choice is a small popup offering the choice but if none is selected, the person remains
                        in the same place.
                    </Text>
                </FormHelperText>
            </FormControl>
        ),
        [isActiveChoice, forceActiveChoice]
    );

    const { colorMode } = useColorMode();
    const [colour, setColour] = useState<string>("#4471de");
    const colourObj = useMemo(() => Color(colour), [colour]);
    const colourInput = useMemo(
        () => (
            <FormControl>
                <FormLabel>Colour</FormLabel>
                <Popover placement="bottom-start" returnFocusOnClose={false} isLazy>
                    <PopoverTrigger>
                        <Button
                            w="100%"
                            color={
                                colourObj.isDark() && !(colorMode === "light" && colour === "rgba(0,0,0,0)")
                                    ? "white"
                                    : "black"
                            }
                            bgColor={colour}
                        >
                            {colour} (Click to edit)
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Box color="black">
                            <SketchPicker
                                width="100%"
                                color={colour}
                                onChange={(c) => setColour(`rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},1)`)}
                            />
                        </Box>
                    </PopoverContent>
                </Popover>
            </FormControl>
        ),
        [colorMode, colour, colourObj]
    );

    const [description, setDescription] = useState<string>("");
    const descriptionInput = useMemo(
        () => (
            <FormControl>
                <FormLabel>Label</FormLabel>
                <Input
                    value={description}
                    onChange={(ev) => {
                        setDescription(ev.target.value);
                    }}
                />
                <FormHelperText>A label for this option.</FormHelperText>
            </FormControl>
        ),
        [description]
    );

    const toIsValid = useMemo(() => {
        switch (to.type) {
            case ContinuationType.URL:
                return to.url === "" ? "Missing URL" : to.text === "" ? "Text missing" : true;
            case ContinuationType.Room:
                return to.id === "" ? "Please choose a room" : true;
            case ContinuationType.Event:
                return to.id === "" ? "Please choose an event" : true;
            case ContinuationType.AutoDiscussionRoom:
                return true;
            case ContinuationType.Item:
                return to.id === "" ? "Please choose an item" : true;
            case ContinuationType.Exhibition:
                return to.id === "" ? "Please choose an exhibition" : true;
            case ContinuationType.ShufflePeriod:
                return to.id === "" ? "Please choose a shuffle period" : true;
            case ContinuationType.Profile:
                return to.id === "" ? "Please choose a profile" : true;
            case ContinuationType.OwnProfile:
                return true;
            case ContinuationType.NavigationView:
                switch (to.view) {
                    case NavigationView.LiveProgramRooms:
                        return true;
                    case NavigationView.HappeningSoon:
                        return true;
                    case NavigationView.Tags:
                        return to.tagId === "" ? "Chosen tag is invalid" : true;
                    case NavigationView.Exhibitions:
                        return true;
                    case NavigationView.Schedule:
                        return true;
                    case NavigationView.SocialRooms:
                        return true;
                    case NavigationView.People:
                        return true;
                    case NavigationView.ShufflePeriods:
                        return true;
                    case NavigationView.MyBackstages:
                        return true;
                }
                return "Unrecognised";
            case ContinuationType.ConferenceLandingPage:
                return true;
        }
    }, [to]);
    const allValid = toIsValid === true ? (description === "" ? "Please write a label" : true) : toIsValid;

    const [insertResponse, insert] = useContinuationsEditor_InsertMutation();

    return (
        <>
            <Button
                size="sm"
                colorScheme="green"
                onClick={onOpen}
                ref={addButtonRef}
                justifySelf="flex-start"
                alignSelf="flex-start"
                p={4}
            >
                <FAIcon iconStyle="s" icon="plus-square" mr={2} />
                Add
            </Button>
            <Modal initialFocusRef={leastDestructiveRef} finalFocusRef={addButtonRef} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add continuation</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            {descriptionInput}
                            {toTypeSelect}
                            {toViewSelect}
                            {toURLInput}
                            {toTextInput}
                            {toRoomsSelect}
                            {toEventsSelect}
                            {toItemsSelect}
                            {toAutoItemsSelect}
                            {toExhibitionsSelect}
                            {toShufflePeriodsSelect}
                            {toProfileSelect}
                            {toTagsSelect}
                            {toDefaultForSelect}
                            {activeChoiceSwitch}
                            {colourInput}
                        </VStack>
                    </ModalBody>
                    <ModalFooter as={VStack}>
                        {insertResponse.error ? (
                            <Alert flexDir="column" status="error" alignItems="flex-start">
                                <HStack mb={1}>
                                    <AlertIcon />
                                    <AlertTitle>Error creating continuation</AlertTitle>
                                </HStack>
                                <AlertDescription>{insertResponse.error.message}</AlertDescription>
                            </Alert>
                        ) : undefined}
                        <ButtonGroup alignSelf="flex-end">
                            <Button
                                size="sm"
                                ref={leastDestructiveRef}
                                onClick={() => {
                                    onClose();
                                }}
                            >
                                <FAIcon iconStyle="s" icon="ban" mr={2} />
                                Cancel
                            </Button>
                            <Tooltip label={allValid === true ? "" : allValid}>
                                <Box>
                                    <Button
                                        size="sm"
                                        colorScheme="green"
                                        onClick={async () => {
                                            try {
                                                await insert(
                                                    {
                                                        object: {
                                                            colour,
                                                            defaultFor,
                                                            description,
                                                            fromEvent: "eventId" in from ? from.eventId : undefined,
                                                            fromShuffleQueue:
                                                                "shufflePeriodId" in from
                                                                    ? from.shufflePeriodId
                                                                    : undefined,
                                                            isActiveChoice,
                                                            priority: defaultPriority,
                                                            to,
                                                        },
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                [AuthHeader.Role]: subconferenceId
                                                                    ? HasuraRoleName.SubconferenceOrganizer
                                                                    : HasuraRoleName.ConferenceOrganizer,
                                                            },
                                                        },
                                                    }
                                                );

                                                setDefaultFor(ContinuationDefaultFor.None);
                                                setDescription("");

                                                onClose();
                                            } catch (e) {
                                                // Empty
                                            }
                                        }}
                                        isDisabled={allValid !== true}
                                        isLoading={insertResponse.fetching}
                                    >
                                        <FAIcon iconStyle="s" icon="plus" mr={2} />
                                        Add
                                    </Button>
                                </Box>
                            </Tooltip>
                        </ButtonGroup>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
