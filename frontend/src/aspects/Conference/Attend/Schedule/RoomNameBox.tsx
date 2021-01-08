import { Center, HStack, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import { Permission_Enum, RoomMode_Enum, Timeline_RoomFragment } from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import { useConferenceCurrentUserActivePermissions } from "../../useConferenceCurrentUserActivePermissions";

export default function RoomNameBox({
    room,
    height,
    showBottomBorder,
    borderColour,
    backgroundColor,
    marginTop,
}: {
    room: Timeline_RoomFragment | string;
    height: number | string;
    showBottomBorder: boolean;
    borderColour: string;
    backgroundColor?: string;
    marginTop?: string;
}): JSX.Element {
    const conference = useConference();
    const activePermissions = useConferenceCurrentUserActivePermissions();
    let roomIcon: JSX.Element | undefined;
    if (typeof room !== "string") {
        switch (room.currentModeName) {
            case RoomMode_Enum.Breakout:
                roomIcon = <FAIcon iconStyle="s" icon="users" />;
                break;
            case RoomMode_Enum.Prerecorded:
                roomIcon = <FAIcon iconStyle="s" icon="film" />;
                break;
            case RoomMode_Enum.Presentation:
                roomIcon = <FAIcon iconStyle="s" icon="chalkboard-teacher" />;
                break;
            case RoomMode_Enum.QAndA:
                roomIcon = <FAIcon iconStyle="s" icon="comments" />;
                break;
        }
    }

    const shouldLink = [
        Permission_Enum.ConferenceViewAttendees,
        Permission_Enum.ConferenceManageSchedule,
    ].some((permission) => activePermissions.has(permission));

    return (
        <Center
            p={4}
            h={height + "px"}
            borderRightWidth={1}
            borderRightStyle="solid"
            borderRightColor={borderColour}
            borderBottomWidth={showBottomBorder ? 1 : 0}
            borderBottomStyle="solid"
            borderBottomColor={borderColour}
            justifyContent="flex-start"
            backgroundColor={backgroundColor}
            role={typeof room === "string" ? "none" : "listitem"}
            mt={marginTop}
            borderTopWidth={marginTop ? 1 : 0}
            borderTopStyle="solid"
            borderTopColor={borderColour}
        >
            {typeof room === "string" ? (
                room
            ) : shouldLink ? (
                <Link
                    as={ReactLink}
                    to={`/conference/${conference.slug}/room/${room.id}`}
                    textDecoration="none"
                    aria-label={`${room.name} room`}
                >
                    <HStack>
                        {roomIcon}
                        <Text>{room.name}</Text>
                    </HStack>
                </Link>
            ) : (
                <HStack aria-label={`${room.name} room`}>
                    {roomIcon}
                    <Text>{room.name}</Text>
                </HStack>
            )}
        </Center>
    );
}
