import { Flex } from "@chakra-ui/react";
import React from "react";
import "./App.css";
import MainMenu from "./components/Menu/MainMenu";
import LastSeenProvider from "./components/OnlineStatus/LastSeenProvider";
import Routing from "./components/Pages/Routing";
import CurrentUserProvider from "./hooks/Users/CurrentUserProvider";

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
