import { Box, Flex, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import "./App.css";
import Routing from "./AppRouting";
import EmojiMartProvider from "./aspects/Emoji/EmojiMartContext";
import MainMenu from "./aspects/Menu/MainMenu";
import { PrimaryMenuButtonsProvider } from "./aspects/Menu/usePrimaryMenuButtons";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
import LastSeenProvider from "./aspects/Users/CurrentUser/OnlineStatus/LastSeenProvider";

interface AppProps {}

function App(_props: AppProps): JSX.Element {
    const page = useMemo(
        () => (
            <Flex
                as="main"
                height="100%"
                width="100%"
                minWidth="300px"
                overflow="hidden"
                // Column-reverse allows us to put the menu last so screen
                // readers see the page content before the menu
                direction="column-reverse"
                padding={["0.4em", "1em"]}
                gridRowGap={["0.4em", "1em"]}
                justifyContent="center"
                alignItems="center"
            >
                <PrimaryMenuButtonsProvider>
                    <Box overflowX="hidden" overflowY="auto" width="100%" mt={2} mb="auto" pb="40px">
                        <VStack spacing={5} width="100%">
                            <Routing />
                            <Box h="40px" display="inline-block" flex="0 0 40px">
                                &nbsp;
                            </Box>
                        </VStack>
                    </Box>
                    <MainMenu />
                </PrimaryMenuButtonsProvider>
            </Flex>
        ),
        []
    );
    return (
        <EmojiMartProvider>
            <LastSeenProvider />
            <CurrentUserProvider>{page}</CurrentUserProvider>
        </EmojiMartProvider>
    );
}

export default App;
