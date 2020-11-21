import { useAuth0 } from "@auth0/auth0-react";
import { Box, ButtonGroup, Center, Spinner } from "@chakra-ui/react";
import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import "./App.css";
import AuthenticationButton from "./components/auth0/AuthenticationButton";
import ProtectedRoute from "./components/auth0/ProtectedRoute";
import UserProfileInfo from "./components/auth0/UserProfileInfo";
import LinkButton from "./components/chakra/LinkButton";
import Echo from "./components/echo/echo";
import FAIcon from "./components/fontawesome/FAIcon";
import UsersList from "./components/UsersList/UsersList";

interface AppProps {}

function App(_props: AppProps): JSX.Element {
    const { isLoading, isAuthenticated } = useAuth0();

    if (isLoading) {
        return (
            <Center w="100%" h="100%">
                <Spinner />
            </Center>
        );
    }

    return (
        <>
            <ButtonGroup>
                <AuthenticationButton />
                <LinkButton
                    aria-label="Home"
                    leftIcon={<FAIcon iconStyle="s" icon="home" />}
                    to={"/"}
                >
                    Home
                </LinkButton>
                <LinkButton
                    aria-label="Echo"
                    leftIcon={<FAIcon iconStyle="s" icon="comment-alt" />}
                    to={"/echo"}
                >
                    Echo
                </LinkButton>
                {isAuthenticated ? (
                    <LinkButton
                        colorScheme="blue"
                        aria-label="Profile"
                        leftIcon={<FAIcon iconStyle="s" icon="user" />}
                        to={"/profile"}
                    >
                        Profile
                    </LinkButton>
                ) : (
                    <></>
                )}
                {isAuthenticated ? (
                    <LinkButton
                        colorScheme="green"
                        aria-label="Users"
                        leftIcon={<FAIcon iconStyle="s" icon="users" />}
                        to={"/users"}
                    >
                        Users
                    </LinkButton>
                ) : (
                    <></>
                )}
            </ButtonGroup>
            <Box>
                <Switch>
                    <Route exact path="/auth0/logged-in">
                        <Redirect to="/profile" />
                    </Route>
                    <Route exact path="/auth0/logged-in/stay-on-page">
                        Staying on this page so you can debug.
                    </Route>
                    <Route exact path="/auth0/logged-out">
                        <Redirect to="/logged-out" />
                    </Route>
                    <Route exact path="/logged-out">
                        You have been logged out.
                    </Route>
                    <Route exact path="/echo">
                        <Echo />
                    </Route>
                    <ProtectedRoute exact path="/users" component={UsersList} />
                    <Route exact path="/">
                        Home page
                    </Route>
                    <ProtectedRoute
                        exact
                        path="/profile"
                        component={UserProfileInfo}
                    />
                </Switch>
            </Box>
        </>
    );
}

export default App;
