import { useColorModeValue } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React, { useMemo } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Route, Switch } from "react-router-dom";
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
import AttendeesContextProvider from "./aspects/Conference/RegistrantsContext";
import ConferenceProvider from "./aspects/Conference/useConference";
import ConferenceCurrentUserActivePermissionsProvider from "./aspects/Conference/useConferenceCurrentUserActivePermissions";
import { CurrentRegistrantProvider } from "./aspects/Conference/useCurrentRegistrant";
import { EmojiFloatProvider } from "./aspects/Emoji/EmojiFloat";
import ForceUserRefresh from "./aspects/ForceUserRefresh/ForceUserRefresh";
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

    const routed = useMemo(
        () => (
            <Switch>
                <Route
                    path="/conference/:confSlug"
                    component={(
                        props: RouteComponentProps<{
                            confSlug: string;
                        }>
                    ) => <AppInner confSlug={props.match.params.confSlug} />}
                />
                <Route path="/">
                    <AppInner confSlug={undefined} />
                </Route>
            </Switch>
        ),
        []
    );

    return (
        <AppSettingsProvider>
            <ThemeProvider theme={chimeTheme}>
                <MeetingProvider>{routed}</MeetingProvider>
            </ThemeProvider>
        </AppSettingsProvider>
    );
}

function AppInner({ confSlug }: { confSlug?: string }): JSX.Element {
    const { choice } = useUXChoice();
    const page = choice === UXChoice.V1 ? <AppPageV1 /> : <AppPageV2 />;

    return (
        <EmojiFloatProvider>
            <RightSidebarCurrentTabProvider>
                <CurrentUserProvider>
                    {confSlug ? (
                        <ConferenceProvider confSlug={confSlug}>
                            <ForceUserRefresh />
                            <ConferenceCurrentUserActivePermissionsProvider>
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
                            </ConferenceCurrentUserActivePermissionsProvider>
                        </ConferenceProvider>
                    ) : (
                        page
                    )}
                </CurrentUserProvider>
            </RightSidebarCurrentTabProvider>
        </EmojiFloatProvider>
    );
}
