import { Flex } from "@chakra-ui/react";
import React from "react";
import "./App.css";
import Routing from "./AppRouting";
import MainMenu from "./aspects/Menu/MainMenu";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
import LastSeenProvider from "./aspects/Users/CurrentUser/OnlineStatus/LastSeenProvider";

interface AppProps {}

function App(_props: AppProps): JSX.Element {
    return (
        <CurrentUserProvider>
            <LastSeenProvider>
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
            </LastSeenProvider>
        </CurrentUserProvider>
    );
}

export default App;
