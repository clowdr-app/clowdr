import { Spinner, Text } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { Suspense, useEffect, useMemo } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
import ProtectedRoute from "./aspects/Auth/ProtectedRoute";
import CenteredSpinner from "./aspects/Chakra/CenteredSpinner";
import { useConferenceTheme } from "./aspects/Chakra/ChakraCustomProvider";
import { LinkButton } from "./aspects/Chakra/LinkButton";
import ConferenceRoutes from "./aspects/Conference/ConferenceRoutes";
import { useAuthParameters } from "./aspects/GQL/AuthParameters";
import { makeContext } from "./aspects/GQL/make-context";
import useMaybeCurrentUser from "./aspects/Users/CurrentUser/useMaybeCurrentUser";
import { useGetSlugForUrlQuery } from "./generated/graphql";

const EmailVerificationRequiredPage = React.lazy(() => import("./aspects/Auth/EmailVerificationRequiredPage"));
const LoggedOutPage = React.lazy(() => import("./aspects/Auth/LoggedOutPage"));
const PasswordResetResultPage = React.lazy(() => import("./aspects/Auth/PasswordResetResultPage"));
const UseInviteOrCreateView = React.lazy(() => import("./aspects/Conference/UseInviteOrCreateView"));
const SubmitItemsPage = React.lazy(() => import("./aspects/Submissions/SubmitItemsPage"));
const SubmitItemPage = React.lazy(() => import("./aspects/Submissions/SubmitItemPage"));
const SubmitElementPage = React.lazy(() => import("./aspects/Submissions/SubmitElementPage"));
const PushNotificationSettings = React.lazy(() => import("./aspects/PushNotifications/PushNotificationSettings"));
const GenericErrorPage = React.lazy(() => import("./aspects/Errors/GenericErrorPage"));
const CRUDTestPage = React.lazy(() => import("./aspects/CRUDTable/CRUDTestPage"));
const PageNotFound = React.lazy(() => import("./aspects/Errors/PageNotFound"));
const AcceptInvitationPage = React.lazy(() => import("./aspects/Invitation/AcceptInvitationPage"));
const SuperUserLandingPage = React.lazy(() => import("./aspects/SuperUser/LandingPage"));
const CurrentUserPage = React.lazy(() => import("./aspects/Users/CurrentUser/CurrentUserPage"));
const ExistingUserLandingPage = React.lazy(() => import("./aspects/Users/ExistingUser/LandingPage"));
const NewUserLandingPage = React.lazy(() => import("./aspects/Users/NewUser/LandingPage"));

const GoogleOAuth = React.lazy(() => import("./aspects/Google/GoogleOAuth").then((x) => ({ default: x.GoogleOAuth })));
const GoogleOAuthRedirect = React.lazy(() =>
    import("./aspects/Google/GoogleOAuth").then((x) => ({ default: x.GoogleOAuthRedirect }))
);
const VideoTestPage = React.lazy(() =>
    import("./aspects/Conference/Attend/Room/Video/VideoTestPage").then((x) => ({ default: x.VideoTestPage }))
);

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
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: mUser ? HasuraRoleName.User : HasuraRoleName.Unauthenticated,
            }),
        [mUser]
    );
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
        <Suspense fallback={<Spinner />}>
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

                <ProtectedRoute
                    altIfNotAuthed={<Redirect to="/" />}
                    exact
                    path="/join"
                    component={UseInviteOrCreateView}
                />

                <ProtectedRoute
                    altIfNotAuthed={<Redirect to="/" />}
                    exact
                    path="/googleoauth2"
                    component={GoogleOAuth}
                />

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
                    ) => <SubmitItemPage magicToken={props.match.params.token} itemId={props.match.params.itemId} />}
                />
                <Route
                    path="/submissions/:token"
                    component={(
                        props: RouteComponentProps<{
                            token: string;
                        }>
                    ) => <SubmitItemsPage magicToken={props.match.params.token} />}
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
        </Suspense>
    );
}
