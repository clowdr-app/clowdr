import { useColorModeValue } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React from "react";
import "reflect-metadata";
import { ThemeProvider } from "styled-components";
import "./App.css";
import AppPageV1 from "./aspects/App/AppPageV1";
import AppPageV2 from "./aspects/App/AppPageV2";
import { AppSettingsProvider } from "./aspects/App/AppSettingsProvider";
import { GlobalChatStateProvider } from "./aspects/Chat/GlobalChatStateProvider";
import { MyBackstagesModalProvider } from "./aspects/Conference/Attend/Profile/MyBackstages";
import { PermissionInstructionsProvider } from "./aspects/Conference/Attend/Room/VideoChat/PermissionInstructionsContext";
import { LiveProgramRoomsModalProvider } from "./aspects/Conference/Attend/Rooms/V2/LiveProgramRoomsModal";
import { SocialiseModalProvider } from "./aspects/Conference/Attend/Rooms/V2/SocialiseModal";
import { ScheduleModalProvider } from "./aspects/Conference/Attend/Schedule/ProgramModal";
import StarredEventsModalProvider from "./aspects/Conference/Attend/Schedule/StarredEventsModal";
import useConferenceIdUpdater from "./aspects/Conference/ConferenceIdUpdater";
import AttendeesContextProvider from "./aspects/Conference/RegistrantsContext";
import ConferenceProvider from "./aspects/Conference/useConference";
import { CurrentRegistrantProvider } from "./aspects/Conference/useCurrentRegistrant";
import { EmojiFloatProvider } from "./aspects/Emoji/EmojiFloat";
import ForceUserRefresh from "./aspects/ForceUserRefresh/ForceUserRefresh";
import { useAuthParameters } from "./aspects/GQL/AuthParameters";
import { LiveEventsProvider } from "./aspects/LiveEvents/LiveEvents";
import { RightSidebarCurrentTabProvider } from "./aspects/Menu/V2/RightSidebar/RightSidebarCurrentTab";
import { RaiseHandProvider } from "./aspects/RaiseHand/RaiseHandProvider";
import { EnableRoomParticipantsPollingProvider } from "./aspects/Room/EnableRoomParticipantsPollingContext";
import RoomParticipantsProvider from "./aspects/Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "./aspects/Room/SharedRoomContextProvider";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
import { useUXChoice, UXChoice } from "./aspects/UXChoice/UXChoice";

// function useQuery() {
//     return new URLSearchParams(useLocation().search);
// }

export default function App(): JSX.Element {
    const chimeTheme = useColorModeValue(lightTheme, darkTheme);

    // const query = useQuery();
    // const bypassDfmMatch = query.get("bypassMaintenance");
    // console.info("bypassDfmMatch", bypassDfmMatch);

    // if (!bypassDfmMatch) {
    //     return <DownForMaintenancePage />;
    // }

    useConferenceIdUpdater();

    return (
        <CurrentUserProvider>
            <AppSettingsProvider>
                <ThemeProvider theme={chimeTheme}>
                    <MeetingProvider>
                        <AppInner />
                    </MeetingProvider>
                </ThemeProvider>
            </AppSettingsProvider>
        </CurrentUserProvider>
    );
}

function AppInner(): JSX.Element {
    const { conferenceId } = useAuthParameters();
    const { choice } = useUXChoice();
    const page = choice === UXChoice.V1 ? <AppPageV1 /> : <AppPageV2 />;

    return (
        <EmojiFloatProvider>
            <RightSidebarCurrentTabProvider>
                {conferenceId ? (
                    <ConferenceProvider conferenceId={conferenceId}>
                        <ForceUserRefresh />
                        <CurrentRegistrantProvider>
                            <GlobalChatStateProvider>
                                <RaiseHandProvider>
                                    <AttendeesContextProvider>
                                        <LiveEventsProvider>
                                            <EnableRoomParticipantsPollingProvider>
                                                <RoomParticipantsProvider>
                                                    <ScheduleModalProvider>
                                                        <LiveProgramRoomsModalProvider>
                                                            <StarredEventsModalProvider>
                                                                <MyBackstagesModalProvider>
                                                                    <SocialiseModalProvider>
                                                                        {/* <ShuffleRoomsQueueMonitor /> */}
                                                                        <PermissionInstructionsProvider>
                                                                            <SharedRoomContextProvider>
                                                                                {page}
                                                                            </SharedRoomContextProvider>
                                                                        </PermissionInstructionsProvider>
                                                                    </SocialiseModalProvider>
                                                                </MyBackstagesModalProvider>
                                                            </StarredEventsModalProvider>
                                                        </LiveProgramRoomsModalProvider>
                                                    </ScheduleModalProvider>
                                                </RoomParticipantsProvider>
                                            </EnableRoomParticipantsPollingProvider>
                                        </LiveEventsProvider>
                                    </AttendeesContextProvider>
                                </RaiseHandProvider>
                            </GlobalChatStateProvider>
                        </CurrentRegistrantProvider>
                    </ConferenceProvider>
                ) : (
                    page
                )}
            </RightSidebarCurrentTabProvider>
        </EmojiFloatProvider>
    );
}
