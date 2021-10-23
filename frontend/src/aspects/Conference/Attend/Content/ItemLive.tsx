import { chakra, Flex, Text, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
    ItemElements_ItemDataFragment,
    ItemEventFragment,
    ItemPage_ItemRoomsFragment,
} from "../../../../generated/graphql";
import { Content_ItemType_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import usePolling from "../../../Generic/usePolling";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import FAIcon from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";

export function ItemLive({
    itemData,
}: {
    itemData: ItemElements_ItemDataFragment & { events: readonly ItemEventFragment[] } & ItemPage_ItemRoomsFragment;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const [liveEvents, setLiveEvents] = useState<ItemEventFragment[] | null>(null);
    // const [nextEvent, setNextEvent] = useState<ItemEventFragment | null>(null);
    // const [now, setNow] = useState<number>(Date.now());
    const computeLiveEvent = useCallback(() => {
        const now = Date.now();
        const currentEvents = itemData.events.filter(
            (event) => Date.parse(event.startTime) <= now + 60000 && now <= Date.parse(event.endTime)
        );
        setLiveEvents(currentEvents);

        // const nextEvent = R.sortWith(
        //     [R.ascend(R.prop("startTime"))],
        //     itemData.events.filter((event) => Date.parse(event.startTime) > now)
        // );
        // setNextEvent(nextEvent.length > 0 ? nextEvent[0] : null);
        // setNow(now);
    }, [itemData.events]);
    usePolling(computeLiveEvent, 30000, true);
    useEffect(() => computeLiveEvent(), [computeLiveEvent]);

    const currentRoom = useMemo(() => (itemData.rooms.length > 0 ? itemData.rooms[0] : undefined), [itemData.rooms]);

    return (
        <Flex mb={2} flexWrap="wrap">
            {currentRoom ? (
                <LinkButton
                    width="100%"
                    to={`${conferencePath}/room/${currentRoom.id}`}
                    size="lg"
                    colorScheme="PrimaryActionButton"
                    height="auto"
                    py={2}
                    mb={2}
                    linkProps={{ mr: 2 }}
                >
                    <VStack spacing={0}>
                        <Text>
                            {itemData.typeName === Content_ItemType_Enum.Sponsor ? (
                                <>
                                    <FAIcon iconStyle="s" icon="video" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                                    <chakra.span verticalAlign="middle" pb={0.7}>
                                        Booth
                                    </chakra.span>
                                </>
                            ) : (
                                <>
                                    <FAIcon iconStyle="s" icon="video" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                                    <chakra.span verticalAlign="middle" pb={0.7}>
                                        Discussion room
                                    </chakra.span>
                                </>
                            )}
                        </Text>
                        <PageCountText path={`${conferencePath}/room/${currentRoom.id}`} />
                    </VStack>
                </LinkButton>
            ) : undefined}
            {liveEvents?.map((event) => (
                <LinkButton
                    width="100%"
                    to={`${conferencePath}/room/${event.roomId}`}
                    key={event.id}
                    size="lg"
                    colorScheme="LiveActionButton"
                    height="auto"
                    py={2}
                    mb={2}
                    linkProps={{ mr: 2 }}
                >
                    <VStack spacing={0}>
                        <FAIcon iconStyle="s" icon="calendar" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                        <chakra.span verticalAlign="middle" pb={0.7}>
                            Live now
                        </chakra.span>
                    </VStack>
                </LinkButton>
            ))}
        </Flex>
    );
}
