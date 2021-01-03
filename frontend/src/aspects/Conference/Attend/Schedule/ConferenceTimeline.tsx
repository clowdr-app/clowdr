import { gql } from "@apollo/client";
import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    Permission_Enum,
    Timeline_RoomFragment,
    Timeline_SelectRoomsQuery,
    useTimeline_SelectRoomsQuery,
} from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import RoomNameBox from "./RoomNameBox";
import RoomTimeline from "./RoomTimeline";
import Scoller from "./Scroller";
import TimeBar from "./TimeBar";
import TimelineZoomControls from "./TimelineZoomControls";
import useTimelineParameters, { TimelineParameters } from "./useTimelineParameters";

gql`
    fragment Timeline_Tag on Tag {
        id
        name
        colour
    }

    fragment Timeline_ContentGroupTag on ContentGroupTag {
        id
        tag {
            ...Timeline_Tag
        }
    }

    fragment Timeline_EventTag on EventTag {
        id
        tag {
            ...Timeline_Tag
        }
    }

    fragment Timeline_ContentItem on ContentItem {
        id
        contentTypeName
        name
        data
        isHidden
        layoutData
    }

    fragment Timeline_Hallway on Hallway {
        id
        name
        colour
        priority
    }

    fragment Timeline_ContentGroupHallway on ContentGroupHallway {
        id
        priority
        layout
        hallway {
            ...Timeline_Hallway
        }
    }

    fragment Timeline_ContentPerson on ContentPerson {
        id
        name
        affiliation
        attendeeId
    }

    fragment Timeline_ContentGroupPerson on ContentGroupPerson {
        id
        priority
        roleName
        person {
            ...Timeline_ContentPerson
        }
    }

    fragment Timeline_EventPerson on EventPerson {
        id
        attendeeId
        name
        affiliation
        roleName
    }

    fragment Timeline_ContentGroup on ContentGroup {
        id
        contentGroupTypeName
        title
        shortTitle
        contentGroupTags {
            ...Timeline_ContentGroupTag
        }
        contentItems {
            ...Timeline_ContentItem
        }
        hallways {
            ...Timeline_ContentGroupHallway
        }
        people {
            ...Timeline_ContentGroupPerson
        }
    }

    fragment Timeline_Event on Event {
        id
        roomId
        intendedRoomModeName
        name
        startTime
        durationSeconds

        contentGroup {
            ...Timeline_ContentGroup
        }
        eventPeople {
            ...Timeline_EventPerson
        }
        eventTags {
            ...Timeline_EventTag
        }
    }

    fragment Timeline_Room on Room {
        id
        name
        currentModeName
        priority
        events {
            ...Timeline_Event
        }
    }

    query Timeline_SelectRooms($conferenceId: uuid!) {
        Room(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Timeline_Room
        }
    }

    query Timeline_SelectRoom($id: uuid!) {
        Room_by_pk(id: $id) {
            ...Timeline_Room
        }
    }
`;

function ConferenceTimelineInner({
    rooms: unsortedRooms,
}: {
    rooms: ReadonlyArray<Timeline_RoomFragment>;
}): JSX.Element {
    const params = useTimelineParameters();

    const rooms = useMemo(() => {
        return [...unsortedRooms].sort((x, y) => x.name.localeCompare(y.name)).sort((x, y) => x.priority - y.priority);
    }, [unsortedRooms]);

    const roomRowHeight = 70;
    const borderColour = useColorModeValue("gray.400", "gray.400");

    return (
        <>
            <Box w="100%">
                <Flex w="100%" direction="row" justify="end">
                    <TimelineZoomControls />
                </Flex>
                <Box w="100%">
                    <Flex direction="row" w="100%" justifyContent="stretch" alignItems="start">
                        <Box flex="1 0 max-content">
                            <Box h={roomRowHeight}></Box>
                            {rooms.map((room, idx) => (
                                <RoomNameBox
                                    key={room.id}
                                    room={room}
                                    height={roomRowHeight}
                                    showBottomBorder={idx !== rooms.length - 1}
                                    borderColour={borderColour}
                                />
                            ))}
                        </Box>
                        <Box w="100%" h="100%" flex="1 1 100%">
                            <TimeBar height={roomRowHeight} borderColour={borderColour} />
                            <Scoller
                                visibleTimeSpanSeconds={params.visibleTimeSpanSeconds}
                                fullTimeSpanSeconds={params.fullTimeSpanSeconds}
                                startAtTimeOffsetSeconds={params.startTimeOffsetSeconds}
                                height={roomRowHeight * rooms.length}
                            >
                                {rooms.map((room, idx) => (
                                    <Box
                                        key={room.id}
                                        w="100%"
                                        h={roomRowHeight}
                                        borderBottomWidth={idx !== rooms.length - 1 ? 1 : 0}
                                        borderBottomStyle="solid"
                                        borderBottomColor={borderColour}
                                    >
                                        <RoomTimeline
                                            room={room}
                                            hideTimeShiftButtons={true}
                                            hideTimeZoomButtons={true}
                                            height={roomRowHeight}
                                        />
                                    </Box>
                                ))}
                            </Scoller>
                        </Box>
                    </Flex>
                </Box>
            </Box>
        </>
    );
}

function ConferenceTimelineFetchWrapper(): JSX.Element {
    const conference = useConference();
    const roomsResult = useTimeline_SelectRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    return (
        <ApolloQueryWrapper<Timeline_SelectRoomsQuery, unknown, ReadonlyArray<Timeline_RoomFragment>>
            queryResult={roomsResult}
            getter={(x) => x.Room}
        >
            {(rooms) => (
                <TimelineParameters>
                    <ConferenceTimelineInner rooms={rooms} />
                </TimelineParameters>
            )}
        </ApolloQueryWrapper>
    );
}

export default function ConferenceTimeline(): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceManageSchedule]}
        >
            <ConferenceTimelineFetchWrapper />
        </RequireAtLeastOnePermissionWrapper>
    );
}
