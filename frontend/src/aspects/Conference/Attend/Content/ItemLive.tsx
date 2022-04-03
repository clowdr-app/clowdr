import { chakra, Flex, Text, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
    ItemElements_ItemDataFragment,
    ItemPage_ItemRoomsFragment,
    ItemPresentationFragment,
    ScheduleEventFragment,
} from "../../../../generated/graphql";
import { Content_ItemType_Enum } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import usePolling from "../../../Hooks/usePolling";
import PageCountText from "../../../Realtime/PageCountText";

export function ItemLive({
    itemData,
}: {
    itemData: ItemElements_ItemDataFragment & {
        sessions: readonly ScheduleEventFragment[];
        presentations: readonly ItemPresentationFragment[];
    } & ItemPage_ItemRoomsFragment;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const [liveEventRoomIds, setLiveEventRoomIds] = useState<string[] | null>(null);
    const computeLiveEvent = useCallback(() => {
        const now = Date.now();
        const currentEvents = [
            ...itemData.sessions
                .filter(
                    (event) =>
                        Date.parse(event.scheduledStartTime) <= now + 60000 && now <= Date.parse(event.scheduledEndTime)
                )
                .map((x) => x.roomId),
            ...itemData.presentations
                .filter(
                    (event) =>
                        event.session &&
                        Date.parse(event.session.scheduledStartTime) <= now + 60000 &&
                        now <= Date.parse(event.session.scheduledEndTime)
                )
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map((x) => x.session!.roomId),
        ];
        setLiveEventRoomIds(currentEvents);
    }, [itemData.presentations, itemData.sessions]);
    usePolling(computeLiveEvent, 30000, true);
    useEffect(() => computeLiveEvent(), [computeLiveEvent]);

    const currentRoom = useMemo(() => (itemData.room ? itemData.room : undefined), [itemData.room]);

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
            {liveEventRoomIds?.map((roomId) => (
                <LinkButton
                    width="100%"
                    to={`${conferencePath}/room/${roomId}`}
                    key={roomId}
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
