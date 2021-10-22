import { chakra, HStack, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import { format } from "date-fns";
import * as R from "ramda";
import React from "react";
import type { SearchPanel_EventFragment } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useConference } from "../../useConference";
import { PlainAuthorsList } from "../Content/AuthorList";
// import ExhibitionNameList from "../Content/ExhibitionNameList";
import TagList from "../Content/TagList";
import { EventModeIcon } from "../Rooms/V2/EventHighlight";

export default function SearchResult_Event({ event }: { event: SearchPanel_EventFragment }): JSX.Element {
    const conference = useConference();
    const shadow = useColorModeValue("md", "light-md");

    return (
        <LinkButton
            w="100%"
            linkProps={{
                w: "100%",
            }}
            py={2}
            h="auto"
            to={
                event.item
                    ? `${conferenceUrl}/item/${event.item.id}`
                    : event.exhibition
                    ? `${conferenceUrl}/exhibition/${event.exhibition.id}`
                    : `${conferenceUrl}/room/${event.roomId}`
            }
            shadow={shadow}
            size="md"
        >
            <HStack w="100%" justifyContent="flex-start" alignItems="flex-start">
                <EventModeIcon mode={event.intendedRoomModeName} fontSize="inherit" />
                <VStack w="100%" justifyContent="flex-start" alignItems="flex-start">
                    <Text whiteSpace="normal" fontSize="sm">
                        Starts {format(new Date(event.startTime), "d MMMM HH:mm")}
                        <chakra.span ml={5} fontSize="xs">
                            {event.endTime && `Ends ${format(new Date(event.endTime), "HH:mm")}`}
                        </chakra.span>
                    </Text>
                    <Text whiteSpace="normal" pl={4} fontWeight="bold">
                        {event.name}
                        {event.item && event.item.title.trim().toLowerCase() !== event.name.trim().toLowerCase()
                            ? `: ${event.item.title}`
                            : ""}
                        {!event.item &&
                        event.exhibition &&
                        event.exhibition.name.trim().toLowerCase() !== event.name.trim().toLowerCase()
                            ? `: ${event.exhibition.name}`
                            : undefined}
                    </Text>
                    <Text whiteSpace="normal" pl={4} fontSize="sm">
                        In {event.room ? event.room.name : "a private room"}
                    </Text>
                    {event.item ? (
                        <PlainAuthorsList pl={4} fontSize="sm" people={event.item.itemPeople} />
                    ) : event.exhibition ? (
                        <PlainAuthorsList
                            pl={4}
                            fontSize="sm"
                            people={R.flatten(event.exhibition.items.map((x) => x.item.itemPeople))}
                            sortByNameOnly
                        />
                    ) : undefined}
                    {event.item ? (
                        <TagList pl={4} tags={event.item.itemTags} noClick />
                    ) : event.exhibition ? (
                        <TagList pl={4} tags={R.flatten(event.exhibition.items.map((x) => x.item.itemTags))} noClick />
                    ) : undefined}
                    {/* {event.item ? (
                <ExhibitionNameList exhibitions={event.item.itemExhibitions} noClick />
            ) : undefined} */}
                </VStack>
            </HStack>
        </LinkButton>
    );
}
