import type { ButtonProps} from "@chakra-ui/react";
import { Button, Image, useToast } from "@chakra-ui/react";
import React from "react";
import type { RegistrantDataFragment } from "../../../generated/graphql";
import FAIcon from "../../Icons/FAIcon";
import { useChatProfileModal } from "../Frame/ChatProfileModalProvider";
import { useIntl } from "react-intl";

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
    const intl = useIntl();
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
                        title: intl.formatMessage({ id: 'chat.messages.profilebox.profileunavaiable', defaultMessage: "Profile currently unavailable" }),
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
                    alt={intl.formatMessage({ id: 'chat.messages.profilebox.profilepicture', defaultMessage: "Profile picture of {name}" }, { name: registrant.displayName })}
                />
            ) : showPlaceholderProfilePictures && registrant !== null ? (
                <FAIcon iconStyle="s" icon="cat" fontSize={((props.w ?? 35) as number) * 0.8 + "px"} />
            ) : (
                <></>
            )}
        </Button>
    );
}
