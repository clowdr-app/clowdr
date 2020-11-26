import { Flex, VStack } from "@chakra-ui/react";
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
                    as="main"
                    height="100%"
                    width="100%"
                    minWidth="300px"
                    overflowY="auto"
                    // Column-reverse allows us to put the menu last so screen
                    // readers see the page content before the menu
                    direction="column-reverse"
                    padding={["0.4em", "1em"]}
                    justifyContent="center"
                    alignItems="center"
                >
                    <VStack
                        spacing={5}
                        overflow="auto"
                        margin="auto"
                        width="100%"
                    >
                        <Routing />
                    </VStack>
                    <MainMenu />
                </Flex>
            </LastSeenProvider>
        </CurrentUserProvider>
    );
}

export default App;
