import { Flex, useColorModeValue } from "@chakra-ui/react";
import React, { useState } from "react";
import { LoginButton, LogoutButton } from "../Auth";
import { useMaybeConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import useIsVeryNarrowView from "../Hooks/useIsVeryNarrowView";
import SearchPopover from "../Search/SearchPopover";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import JoinButton from "./JoinButton";
import LeftMenuToggleButton from "./LeftMenuToggleButton";
import NameButton from "./NameButton";
import NotificationsPopover from "./NotificationsPopover";
import ProfileMenu from "./ProfileMenu";
import RightMenuToggleButton from "./RightMenuToggleButton";

export default function HeaderBar({
    leftMenuOpen,
    rightMenuOpen,
    setRightMenuOpen,
    toggleLeftMenu,
}: {
    leftMenuOpen: boolean;
    rightMenuOpen: boolean;
    setRightMenuOpen: (value: boolean | ((old: boolean) => boolean)) => void;
    toggleLeftMenu: () => void;
}): JSX.Element {
    const maybeConference = useMaybeConference();
    const maybeUser = useMaybeCurrentUser()?.user;
    const maybeRegistrant = useMaybeCurrentRegistrant();

    const bgColor = useColorModeValue(
        "MainMenuHeaderBar.backgroundColor-light",
        "MainMenuHeaderBar.backgroundColor-dark"
    );
    const textColor = useColorModeValue("MainMenuHeaderBar.textColor-light", "MainMenuHeaderBar.textColor-dark");
    const isNarrowView = useIsNarrowView();
    const isVeryNarrowView = useIsVeryNarrowView();

    const [searchIsActive, setSearchIsActive] = useState<boolean>(false);

    return (
        <Flex
            bgColor={bgColor}
            color={textColor}
            w="100%"
            alignItems="center"
            zIndex={4}
            h="calc(6ex + 6px)"
            overflow="hidden"
            flexWrap="nowrap"
            flex="0 0 auto"
        >
            {maybeConference ? <LeftMenuToggleButton isOpen={leftMenuOpen} toggle={toggleLeftMenu} /> : undefined}
            {isVeryNarrowView || !isNarrowView || !maybeConference || !searchIsActive ? <NameButton /> : undefined}
            {maybeConference ? (
                <>
                    {!isVeryNarrowView ? (
                        <SearchPopover isActive={searchIsActive} setIsActive={setSearchIsActive} />
                    ) : undefined}
                    {maybeRegistrant ? (
                        <>
                            <NotificationsPopover />
                            <RightMenuToggleButton isOpen={rightMenuOpen} setIsOpen={setRightMenuOpen} />
                            <ProfileMenu />
                        </>
                    ) : !maybeUser ? (
                        <LoginButton asMenuButton={true} />
                    ) : (
                        <JoinButton />
                    )}
                </>
            ) : !maybeUser ? (
                <LoginButton asMenuButton={true} />
            ) : (
                <LogoutButton asMenuButton={true} />
            )}
        </Flex>
    );
}
