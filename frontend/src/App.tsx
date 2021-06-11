import { useColorModeValue } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React, { useMemo } from "react";
import { Route, RouteComponentProps, Switch, useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import "./App.css";
import AppPageV1 from "./aspects/App/AppPageV1";
import AppPageV2 from "./aspects/App/AppPageV2";
import { GlobalChatStateProvider } from "./aspects/Chat/GlobalChatStateProvider";
import { ScheduleModalProvider } from "./aspects/Conference/Attend/Schedule/ProgramModal";
import AttendeesContextProvider from "./aspects/Conference/RegistrantsContext";
import ConferenceProvider from "./aspects/Conference/useConference";
import ConferenceCurrentUserActivePermissionsProvider from "./aspects/Conference/useConferenceCurrentUserActivePermissions";
import { CurrentRegistrantProvider } from "./aspects/Conference/useCurrentRegistrant";
import { EmojiFloatProvider } from "./aspects/Emoji/EmojiFloat";
import ForceUserRefresh from "./aspects/ForceUserRefresh/ForceUserRefresh";
import { LiveEventsProvider } from "./aspects/LiveEvents/LiveEvents";
import { RightSidebarCurrentTabProvider } from "./aspects/Menu/V2/RightSidebar/RightSidebarCurrentTab";
import { RaiseHandProvider } from "./aspects/RaiseHand/RaiseHandProvider";
import RoomParticipantsProvider from "./aspects/Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "./aspects/Room/SharedRoomContextProvider";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
import { useUXChoice, UXChoice } from "./aspects/UXChoice/UXChoice";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

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
        <ThemeProvider theme={chimeTheme}>
            <MeetingProvider>{routed}</MeetingProvider>
        </ThemeProvider>
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
                                                    <RoomParticipantsProvider>
                                                        <ScheduleModalProvider>
                                                            {/* <ShuffleRoomsQueueMonitor /> */}
                                                            <SharedRoomContextProvider>
                                                                {page}
                                                            </SharedRoomContextProvider>
                                                        </ScheduleModalProvider>
                                                    </RoomParticipantsProvider>
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
