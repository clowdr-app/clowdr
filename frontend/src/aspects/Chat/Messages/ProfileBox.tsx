import { Button, ButtonProps, Image, useToast } from "@chakra-ui/react";
import React from "react";
import type { RegistrantDataFragment } from "../../../generated/graphql";
import FAIcon from "../../Icons/FAIcon";
import { useChatProfileModal } from "../Frame/ChatProfileModalProvider";

export default function ProfilePictureBox({
    registrant,
    showPlaceholderProfilePictures,
    showProfilePictures,
    ...props
}: {
    registrant: RegistrantDataFragment | null;
    showPlaceholderProfilePictures: boolean;
    showProfilePictures: boolean;
} & ButtonProps): JSX.Element {
    const profileModal = useChatProfileModal();
    const toast = useToast();

    return (
        <Button
            maxW="40px"
            maxH="40px"
            minW="unset"
            minH="unset"
            w="100%"
            h="auto"
            p={0}
            m={0}
            background="none"
            aria-label={`View ${registrant?.displayName ?? "unknown"} profile`}
            {...props}
            onClick={() => {
                if (registrant && registrant.profile) {
                    profileModal.open({
                        ...registrant,
                        profile: registrant.profile,
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
            {showProfilePictures && registrant && registrant.profile && registrant.profile.photoURL_50x50 ? (
                <Image
                    borderRadius={5}
                    w="100%"
                    h="auto"
                    objectFit="cover"
                    objectPosition="center"
                    src={registrant.profile.photoURL_50x50}
                    overflow="hidden"
                    alt={`Profile picture of ${registrant.displayName}`}
                />
            ) : showPlaceholderProfilePictures && registrant !== null ? (
                <FAIcon iconStyle="s" icon="cat" fontSize={((props.w ?? 35) as number) * 0.8 + "px"} />
            ) : (
                <></>
            )}
        </Button>
    );
}
