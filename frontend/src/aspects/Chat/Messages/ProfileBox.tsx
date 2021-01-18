import { Button, ButtonProps, Image, useToast } from "@chakra-ui/react";
import React from "react";
import type { AttendeeDataFragment } from "../../../generated/graphql";
import FAIcon from "../../Icons/FAIcon";
import { useChatConfiguration } from "../Configuration";
import { useChatProfileModal } from "../Frame/ChatProfileModalProvider";

export default function ProfilePictureBox({
    attendee,
    ...props
}: { attendee: AttendeeDataFragment | null } & ButtonProps): JSX.Element {
    const config = useChatConfiguration();
    const profileModal = useChatProfileModal();
    const toast = useToast();

    return (
        <Button
            maxW="50px"
            maxH="50px"
            minW="unset"
            minH="unset"
            w="100%"
            h="auto"
            p={0}
            m={0}
            background="none"
            {...props}
            onClick={() => {
                if (attendee && attendee.profile) {
                    profileModal.open({
                        ...attendee,
                        profile: attendee.profile,
                    });
                } else {
                    toast({
                        status: "warning",
                        title: "Profile currently unavailable",
                        duration: 2000,
                    });
                }
            }}
            fontSize="inherit"
        >
            {config.messageConfig.showProfilePictures &&
            attendee &&
            attendee.profile &&
            attendee.profile.photoURL_50x50 ? (
                <Image
                    borderRadius={5}
                    w="100%"
                    h="auto"
                    objectFit="cover"
                    objectPosition="center"
                    src={attendee.profile.photoURL_50x50}
                    aria-label={`Profile picture of ${attendee.displayName}`}
                    overflow="hidden"
                />
            ) : config.messageConfig.showPlaceholderProfilePictures && attendee !== null ? (
                <FAIcon iconStyle="s" icon="cat" fontSize={((props.w ?? 35) as number) * 0.8 + "px"} />
            ) : (
                <></>
            )}
        </Button>
    );
}
