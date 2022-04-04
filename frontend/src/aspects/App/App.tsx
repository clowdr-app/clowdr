import { useColorModeValue } from "@chakra-ui/react";
import { darkTheme, lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import "reflect-metadata";
import { ThemeProvider as ChimeThemeProvider } from "styled-components";
import { AppSettingsProvider } from "../App";
import { Auth0Provider } from "../Auth";
import ChakraCustomProvider from "../Chakra/ChakraCustomProvider";
import { GlobalChatStateProvider } from "../Chat/GlobalChatStateProvider";
import { PermissionInstructionsProvider } from "../Conference/Attend/Room/VideoChat/PermissionInstructionsContext";
import { VonageGlobalStateProvider } from "../Conference/Attend/Room/Vonage/State/VonageGlobalStateProvider";
import useConferenceIdUpdater from "../Conference/ConferenceIdUpdater";
import RegistrantsContextProvider from "../Conference/RegistrantsContext";
import { ConferenceProvider } from "../Conference/useConference";
import { CurrentRegistrantProvider, CurrentRegistrantUpdater } from "../Conference/useCurrentRegistrant";
import { EmojiFloatProvider } from "../Emoji/EmojiFloat";
import ForceUserRefresh from "../ForceUserRefresh/ForceUserRefresh";
import { AuthParametersProvider, useAuthParameters } from "../GQL/AuthParameters";
import UrqlProvider from "../GQL/UrqlProvider";
import { LiveEventsProvider } from "../LiveEvents/LiveEvents";
import { RaiseHandProvider } from "../RaiseHand/RaiseHandProvider";
import { SharedRoomContextProvider } from "../Room/SharedRoomContextProvider";
import CurrentUserProvider from "../Users/CurrentUser/CurrentUserProvider";
import "./App.css";
import { AppLayoutProvider } from "./AppLayoutContext";
import AppPage from "./AppPage";
import AppRouting from "./AppRouting";
import DetectSlug from "./DetectSlug";

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

    const { conferenceId } = useAuthParameters();
    useConferenceIdUpdater();

    return (
        <EmojiFloatProvider>
            <CurrentUserProvider>
                {(currentUserChildren) => (
                    <DetectSlug>
                        {(detectSlugChildren) => (
                            <AppSettingsProvider>
                                <ConferenceProvider
                                    conferenceId={conferenceId && conferenceId !== "NONE" ? conferenceId : undefined}
                                >
                                    {(conferenceChildren) => (
                                        <CurrentRegistrantProvider>
                                            <LiveEventsProvider>
                                                <RegistrantsContextProvider>
                                                    <GlobalChatStateProvider>
                                                        <RaiseHandProvider>
                                                            <AppLayoutProvider>
                                                                <AppPage>
                                                                    {currentUserChildren ??
                                                                        detectSlugChildren ??
                                                                        conferenceChildren ?? (
                                                                            <ChimeThemeProvider theme={chimeTheme}>
                                                                                <MeetingProvider>
                                                                                    <AppInner2 />
                                                                                </MeetingProvider>
                                                                            </ChimeThemeProvider>
                                                                        )}
                                                                </AppPage>
                                                            </AppLayoutProvider>
                                                        </RaiseHandProvider>
                                                    </GlobalChatStateProvider>
                                                </RegistrantsContextProvider>
                                            </LiveEventsProvider>
                                        </CurrentRegistrantProvider>
                                    )}
                                </ConferenceProvider>
                            </AppSettingsProvider>
                        )}
                    </DetectSlug>
                )}
            </CurrentUserProvider>
        </EmojiFloatProvider>
    );
}

function AppInner2(): JSX.Element {
    const { conferenceId } = useAuthParameters();

    const page = (
        <Suspense fallback={<></>}>
            <AppRouting />
        </Suspense>
    );

    return (
        <>
            {conferenceId && conferenceId !== "NONE" ? (
                <>
                    <CurrentRegistrantUpdater />

                    <ForceUserRefresh />

                    <PermissionInstructionsProvider>
                        <SharedRoomContextProvider>{page}</SharedRoomContextProvider>
                    </PermissionInstructionsProvider>
                </>
            ) : (
                page
            )}
        </>
    );
}
