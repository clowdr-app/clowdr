import { useColorModeValue } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import "reflect-metadata";
import { ThemeProvider as ChimeThemeProvider } from "styled-components";
import "./App.css";
import AppPage from "./aspects/App/AppPage";
import { AppSettingsProvider } from "./aspects/App/AppSettingsProvider";
import Auth0CustomProvider from "./aspects/Auth/Auth0CustomProvider";
import ChakraCustomProvider from "./aspects/Chakra/ChakraCustomProvider";
import { GlobalChatStateProvider } from "./aspects/Chat/GlobalChatStateProvider";
import { MyBackstagesModalProvider } from "./aspects/Conference/Attend/Profile/MyBackstages";
import { PermissionInstructionsProvider } from "./aspects/Conference/Attend/Room/VideoChat/PermissionInstructionsContext";
import { VonageGlobalStateProvider } from "./aspects/Conference/Attend/Room/Vonage/VonageGlobalStateProvider";
import { LiveProgramRoomsModalProvider } from "./aspects/Conference/Attend/Rooms/V2/LiveProgramRoomsModal";
import { SocialiseModalProvider } from "./aspects/Conference/Attend/Rooms/V2/SocialiseModalProvider";
import { ScheduleModalProvider } from "./aspects/Conference/Attend/Schedule/ProgramModal";
import StarredEventsModalProvider from "./aspects/Conference/Attend/Schedule/StarredEventsModal";
import useConferenceIdUpdater from "./aspects/Conference/ConferenceIdUpdater";
import AttendeesContextProvider from "./aspects/Conference/RegistrantsContext";
import ConferenceProvider from "./aspects/Conference/useConference";
import { CurrentRegistrantProvider } from "./aspects/Conference/useCurrentRegistrant";
import { EmojiFloatProvider } from "./aspects/Emoji/EmojiFloat";
import ForceUserRefresh from "./aspects/ForceUserRefresh/ForceUserRefresh";
import { AuthParametersProvider, useAuthParameters } from "./aspects/GQL/AuthParameters";
import UrqlProvider from "./aspects/GQL/UrqlProvider";
import { LiveEventsProvider } from "./aspects/LiveEvents/LiveEvents";
import { RightSidebarCurrentTabProvider } from "./aspects/Menu/RightSidebar/RightSidebarCurrentTab";
import { RaiseHandProvider } from "./aspects/RaiseHand/RaiseHandProvider";
import { EnableRoomParticipantsPollingProvider } from "./aspects/Room/EnableRoomParticipantsPollingContext";
import RoomParticipantsProvider from "./aspects/Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "./aspects/Room/SharedRoomContextProvider";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";

// function useQuery() {
//     return new URLSearchParams(useLocation().search);
// }

export default function App(): JSX.Element {
    return (
        <VonageGlobalStateProvider>
            <AuthParametersProvider>
                <HelmetProvider>
                    <BrowserRouter>
                        <ChakraCustomProvider>
                            <Auth0CustomProvider>
                                <UrqlProvider>
                                    <AppInner />
                                </UrqlProvider>
                            </Auth0CustomProvider>
                        </ChakraCustomProvider>
                    </BrowserRouter>
                </HelmetProvider>
            </AuthParametersProvider>
        </VonageGlobalStateProvider>
    );
}

function AppInner(): JSX.Element {
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
                <ChimeThemeProvider theme={chimeTheme}>
                    <MeetingProvider>
                        <AppInner2 />
                    </MeetingProvider>
                </ChimeThemeProvider>
            </AppSettingsProvider>
        </CurrentUserProvider>
    );
}

function AppInner2(): JSX.Element {
    const { conferenceId } = useAuthParameters();
    const page = (
        <Suspense fallback={<></>}>
            <AppPage />
        </Suspense>
    );

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
