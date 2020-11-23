import { useAuth0 } from "@auth0/auth0-react";
import { Center, Flex, Spinner } from "@chakra-ui/react";
import React from "react";
import "./App.css";
import MainMenu from "./components/Menu/MainMenu";
import ManageLastSeen from "./components/OnlineStatus/ManageLastSeen";
import Routing from "./components/Pages/Routing";
import ManageChats from "./hooks/Chats/ManageChats";
import ManageCurrentUser from "./hooks/Users/ManageCurrentUser";
import ManageUsers from "./hooks/Users/ManageUsers";

interface AppProps {}

function App(_props: AppProps): JSX.Element {
    const { isLoading } = useAuth0();

    if (isLoading) {
        return (
            <Center w="100%" h="100%">
                <Spinner />
            </Center>
        );
    }

    return (
        <ManageCurrentUser>
            <ManageUsers>
                <ManageChats>
                    <ManageLastSeen>
                        <Flex
                            height="100%"
                            width="100%"
                            minWidth="300px"
                            direction="column"
                            padding={["0em", "1em"]}
                            gap={0}
                        >
                            <MainMenu />
                            <Routing />
                        </Flex>
                    </ManageLastSeen>
                </ManageChats>
            </ManageUsers>
        </ManageCurrentUser>
    );
}

export default App;
