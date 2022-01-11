import { useColorModeValue } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import "reflect-metadata";
import { ThemeProvider as ChimeThemeProvider } from "styled-components";
import { AppSettingsProvider } from "../App";
import AppPage from "../App/AppPage";
import { Auth0Provider } from "../Auth";
import ChakraCustomProvider from "../Chakra/ChakraCustomProvider";
import { GlobalChatStateProvider } from "../Chat/GlobalChatStateProvider";
import { MyBackstagesModalProvider } from "../Conference/Attend/Profile/MyBackstages";
import { PermissionInstructionsProvider } from "../Conference/Attend/Room/VideoChat/PermissionInstructionsContext";
import { VonageGlobalStateProvider } from "../Conference/Attend/Room/Vonage/VonageGlobalStateProvider";
import { SocialiseModalProvider } from "../Conference/Attend/Rooms/V2/SocialiseModalProvider";
import { LiveProgramRoomsProvider } from "../Conference/Attend/Rooms/V2/useLiveProgramRooms";
import { ScheduleModalProvider } from "../Conference/Attend/Schedule/ProgramModal";
import StarredEventsModalProvider from "../Conference/Attend/Schedule/StarredEventsModal";
import useConferenceIdUpdater from "../Conference/ConferenceIdUpdater";
import AttendeesContextProvider from "../Conference/RegistrantsContext";
import ConferenceProvider from "../Conference/useConference";
import { CurrentRegistrantProvider } from "../Conference/useCurrentRegistrant";
import { EmojiFloatProvider } from "../Emoji/EmojiFloat";
import ForceUserRefresh from "../ForceUserRefresh/ForceUserRefresh";
import { AuthParametersProvider, useAuthParameters } from "../GQL/AuthParameters";
import UrqlProvider from "../GQL/UrqlProvider";
import { LiveEventsProvider } from "../LiveEvents/LiveEvents";
import { NavigationStateProvider } from "../Menu/NavigationState";
import { RightSidebarCurrentTabProvider } from "../Menu/RightSidebar/RightSidebarCurrentTab";
import { RaiseHandProvider } from "../RaiseHand/RaiseHandProvider";
import { EnableRoomParticipantsPollingProvider } from "../Room/EnableRoomParticipantsPollingContext";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "../Room/SharedRoomContextProvider";
import CurrentUserProvider from "../Users/CurrentUser/CurrentUserProvider";
import "./App.css";

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
                            <Auth0Provider>
                                <UrqlProvider>
                                    <AppInner />
                                </UrqlProvider>
                            </Auth0Provider>
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
                <NavigationStateProvider>
                    <ChimeThemeProvider theme={chimeTheme}>
                        <MeetingProvider>
                            <AppInner2 />
                        </MeetingProvider>
                    </ChimeThemeProvider>
                </NavigationStateProvider>
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
                {conferenceId && conferenceId !== "NONE" ? (
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
                                                        <LiveProgramRoomsProvider>
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
                                                        </LiveProgramRoomsProvider>
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
