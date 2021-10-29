import { Text } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { gql } from "@urql/core";
import React, { useEffect, useMemo } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
import EmailVerificationRequiredPage from "./aspects/Auth/EmailVerificationRequiredPage";
import LoggedOutPage from "./aspects/Auth/LoggedOutPage";
import PasswordResetResultPage from "./aspects/Auth/PasswordResetResultPage";
import ProtectedRoute from "./aspects/Auth/ProtectedRoute";
import CenteredSpinner from "./aspects/Chakra/CenteredSpinner";
import { useConferenceTheme } from "./aspects/Chakra/ChakraCustomProvider";
import { LinkButton } from "./aspects/Chakra/LinkButton";
import { VideoTestPage } from "./aspects/Conference/Attend/Room/Video/VideoTestPage";
import ConferenceRoutes from "./aspects/Conference/ConferenceRoutes";
import UseInviteOrCreateView from "./aspects/Conference/UseInviteOrCreateView";
import ViewItemPage from "./aspects/Content/Submissions/ViewItemPage";
import ViewItemsPage from "./aspects/Content/Submissions/ViewItemsPage";
import SubmitElementPage from "./aspects/Content/SubmitElementPage";
import CRUDTestPage from "./aspects/CRUDTable/CRUDTestPage";
import GenericErrorPage from "./aspects/Errors/GenericErrorPage";
import PageNotFound from "./aspects/Errors/PageNotFound";
import { GoogleOAuth, GoogleOAuthRedirect } from "./aspects/Google/GoogleOAuth";
import { useAuthParameters } from "./aspects/GQL/AuthParameters";
import { useShieldedHeaders } from "./aspects/GQL/useShieldedHeaders";
import AcceptInvitationPage from "./aspects/Invitation/AcceptInvitationPage";
import PushNotificationSettings from "./aspects/PushNotifications/PushNotificationSettings";
import SuperUserLandingPage from "./aspects/SuperUser/LandingPage";
import CurrentUserPage from "./aspects/Users/CurrentUser/CurrentUserPage";
import useMaybeCurrentUser from "./aspects/Users/CurrentUser/useMaybeCurrentUser";
import ExistingUserLandingPage from "./aspects/Users/ExistingUser/LandingPage";
import NewUserLandingPage from "./aspects/Users/NewUser/LandingPage";
import { useGetSlugForUrlQuery } from "./generated/graphql";

gql`
    query GetSlugForUrl($url: String!) {
        getSlug(url: $url) {
            slug
        }
    }
`;

export default function DetectSlug(): JSX.Element {
    return (
        <Switch>
            <Route
                path="/conference/:confSlug"
                component={(
                    props: RouteComponentProps<{
                        confSlug: string;
                    }>
                ) => <Routing confSlug={props.match.params.confSlug} />}
            />
            <Route path="/">
                <CheckSlug />
            </Route>
        </Switch>
    );
}

function CheckSlug(): JSX.Element {
    const slugCache = useMemo(() => {
        const str = window.localStorage.getItem("SLUG_CACHE");
        if (str) {
            return JSON.parse(str);
        }
        return null;
    }, []);
    const origin = useMemo(() => window.location.origin, []);
    const existingMapping = useMemo(() => {
        const entry = slugCache?.[origin];
        if (entry) {
            try {
                assert.truthy(entry.expiry && typeof entry.expiry === "number");
                assert.truthy(entry.value && typeof entry.expiry === "string");
                if (entry.expiry > Date.now()) {
                    return entry.value as string;
                } else {
                    delete slugCache[origin];
                    window.localStorage.setItem("SLUG_CACHE", slugCache);
                }
            } catch {
                window.localStorage.removeItem("SLUG_CACHE");
            }
        }
        return undefined;
    }, [origin, slugCache]);
    if (!existingMapping) {
        return <CheckSlugInner />;
    } else {
        return <Routing confSlug={existingMapping} />;
    }
}

function CheckSlugInner(): JSX.Element {
    const origin = useMemo(() => window.location.origin, []);
    const mUser = useMaybeCurrentUser();
    const context = useShieldedHeaders({
        "X-Auth-Role": mUser ? "user" : "unauthenticated",
    });
    const [response] = useGetSlugForUrlQuery({
        variables: {
            url: origin,
        },
        context,
    });
    useEffect(() => {
        if (response.data?.getSlug?.slug) {
            const cacheStr = window.localStorage.getItem("SLUG_CACHE");
            let cache;
            if (cacheStr) {
                cache = JSON.parse(cacheStr);
            } else {
                cache = {};
            }
            cache[origin] = { value: response.data.getSlug.slug, expiry: Date.now() + 7 * 24 * 60 * 60 * 1000 };
            window.localStorage.setItem("SLUG_CACHE", JSON.stringify(cache));
        }
    }, [origin, response.data?.getSlug?.slug]);
    if (!response.fetching && response.data) {
        if (!response.data.getSlug?.slug) {
            return <Routing />;
        } else {
            return <Routing confSlug={response.data.getSlug.slug} />;
        }
    }

    return <CenteredSpinner />;
}

function Routing({ confSlug }: { confSlug?: string }): JSX.Element {
    const { url } = useRouteMatch();
    const { setConferenceSlug, setConferencePath } = useAuthParameters();
    const { setTheme } = useConferenceTheme();
    useEffect(() => {
        if (!confSlug) {
            setTheme(undefined);
        }

        setConferenceSlug(confSlug ?? null);
        setConferencePath(confSlug ? (url.endsWith("/") ? url.substring(0, url.length - 1) : url) : null);
    }, [confSlug, setTheme, setConferenceSlug, setConferencePath, url]);

    const { conferenceId } = useAuthParameters();

    return (
        <Switch>
            <ProtectedRoute component={PushNotificationSettings} exact path="/user/pushNotifications" />
            <ProtectedRoute component={SuperUserLandingPage} exact path="/su" />

            <Route exact path="/auth0/email-verification/result">
                {(props) => {
                    const searchParams = new URLSearchParams(props.location.search);
                    const success = searchParams.get("success");
                    const message = searchParams.get("message");
                    if (success === "true" || message === "This account is already verified.") {
                        return <EmailVerificationRequiredPage success={true} message={message} />;
                    }
                    return <EmailVerificationRequiredPage success={false} message={message} />;
                }}
            </Route>
            <Route
                path="/auth0/logged-in"
                render={(props) => {
                    const searchParams = new URLSearchParams(props.location.search);

                    if (props.location.search.includes("error")) {
                        if (props.location.search.includes("verify")) {
                            return <Redirect to="/auth0/email-verification/result" />;
                        } else {
                            return (
                                <GenericErrorPage heading="Authentication error">
                                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                                        Sorry, an authentication error has occurred. Please try again later.
                                    </Text>
                                </GenericErrorPage>
                            );
                        }
                    } else {
                        const redirecToRaw = searchParams.get("redirectTo");
                        const redirectTo = redirecToRaw ? decodeURI(redirecToRaw) : null;
                        if (redirectTo) {
                            return <Redirect to={redirectTo} />;
                        } else {
                            return <Redirect to="/user" />;
                        }
                    }
                }}
            />
            <Route exact path="/auth0/logged-in/stay-on-page">
                Staying on this page so you can debug.
            </Route>
            <Route exact path="/auth0/logged-out">
                <Redirect to="/logged-out" />
            </Route>
            <Route exact path="/auth0/error">
                <GenericErrorPage heading="Sorry, an authentication error occurred…">
                    <>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                            Please try again later
                        </Text>
                        <LinkButton aria-label="Go to home" to="/">
                            Go to home
                        </LinkButton>
                    </>
                </GenericErrorPage>
            </Route>
            <Route exact path="/auth0/blocked">
                <GenericErrorPage heading="Sorry, your account has been blocked…">
                    <>
                        <LinkButton aria-label="Go to home" to="/">
                            Go to home
                        </LinkButton>
                    </>
                </GenericErrorPage>
            </Route>
            <Route exact path="/auth0/password/reset/result">
                {(props) => {
                    const searchParams = new URLSearchParams(props.location.search);
                    const success = searchParams.get("success");
                    const message = searchParams.get("message");
                    return <PasswordResetResultPage message={message} success={success === "true"} />;
                }}
            </Route>
            <Route exact path="/logged-out">
                <LoggedOutPage />
            </Route>

            <ProtectedRoute exact path="/user" component={CurrentUserPage} />

            <Route
                exact
                path="/invitation/accept/:inviteCode"
                component={(
                    props: RouteComponentProps<{
                        inviteCode: string;
                    }>
                ) => <AcceptInvitationPage inviteCode={props.match.params.inviteCode} />}
            />
            <Route exact path="/invitation/accept" component={AcceptInvitationPage} />

            <Route exact path="/crud/test" component={CRUDTestPage} />

            <ProtectedRoute altIfNotAuthed={<Redirect to="/" />} exact path="/join" component={UseInviteOrCreateView} />

            <ProtectedRoute altIfNotAuthed={<Redirect to="/" />} exact path="/googleoauth2" component={GoogleOAuth} />

            {/* A page for easy testing of the HLS video player */}
            <Route path="/video-player" component={VideoTestPage} />

            <Route
                path="/submissions/:token/item/:itemId/element/:elementId"
                component={(
                    props: RouteComponentProps<{
                        token: string;
                        itemId: string;
                        elementId: string;
                    }>
                ) => (
                    <SubmitElementPage
                        magicToken={props.match.params.token}
                        itemId={props.match.params.itemId}
                        elementId={props.match.params.elementId}
                    />
                )}
            />

            <Route
                path="/submissions/:token/item/:itemId"
                component={(
                    props: RouteComponentProps<{
                        token: string;
                        itemId: string;
                    }>
                ) => <ViewItemPage magicToken={props.match.params.token} itemId={props.match.params.itemId} />}
            />
            <Route
                path="/submissions/:token"
                component={(
                    props: RouteComponentProps<{
                        token: string;
                    }>
                ) => <ViewItemsPage magicToken={props.match.params.token} />}
            />

            <Route exact path="/googleoauth" component={GoogleOAuthRedirect} />

            {!confSlug ? (
                <Switch>
                    <ProtectedRoute
                        altIfNotAuthed={
                            <Route exact path="/">
                                <NewUserLandingPage />
                            </Route>
                        }
                        exact
                        path="/"
                        component={ExistingUserLandingPage}
                    />
                    <Route path="/">
                        <PageNotFound />
                    </Route>
                </Switch>
            ) : conferenceId ? (
                <ConferenceRoutes />
            ) : (
                <CenteredSpinner centerProps={{ minHeight: "calc(100vh - 40px)" }} />
            )}
        </Switch>
    );
}
