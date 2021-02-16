import { Box, Flex, useBreakpointValue, VStack } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { Route, RouteComponentProps } from "react-router-dom";
import "./App.css";
import Routing from "./AppRouting";
import EmojiMartProvider from "./aspects/Emoji/EmojiMartContext";
import LeftSidebar from "./aspects/Menu/LeftSidebar";
import MainMenu from "./aspects/Menu/MainMenu";
import RightSidebar from "./aspects/Menu/RightSidebar";
import CurrentUserProvider from "./aspects/Users/CurrentUser/CurrentUserProvider";
// import LastSeenProvider from "./aspects/Users/CurrentUser/OnlineStatus/LastSeenProvider";

interface AppProps {}

function App(_props: AppProps): JSX.Element {
    const leftSidebarWidthPc = 20;
    const rightSidebarWidthPc = 20;
    const contentWidthPc = 100 - leftSidebarWidthPc - rightSidebarWidthPc;

    const leftDefaultVisible = useBreakpointValue({
        base: false,
        lg: true,
    });
    const rightDefaultVisible = useBreakpointValue({
        base: false,
        xl: true,
    });
    const centerAlwaysVisible = useBreakpointValue({
        base: false,
        md: true,
    });
    const [leftOpen, setLeftOpen] = useState<boolean | null>(null);
    const [rightOpen, setRightOpen] = useState<boolean | null>(null);
    const leftVisible = !!leftOpen;
    const rightVisible = rightOpen && (rightDefaultVisible || !leftVisible);

    useEffect(() => {
        if (leftOpen === null && leftDefaultVisible !== undefined) {
            setLeftOpen(leftDefaultVisible);
        }
    }, [leftDefaultVisible, leftOpen]);

    useEffect(() => {
        if (rightOpen === null && rightDefaultVisible !== undefined) {
            setRightOpen(rightDefaultVisible);
        }
    }, [rightDefaultVisible, rightOpen]);

    const centerVisible = centerAlwaysVisible || (!leftVisible && !rightVisible);

    const left = useMemo(
        () => (
            <Route
                path="/conference/:confSlug"
                component={(
                    props: RouteComponentProps<{
                        confSlug: string;
                    }>
                ) => <LeftSidebar rootUrl={props.match.url} confSlug={props.match.params.confSlug} />}
            />
        ),
        []
    );
    const leftBar = useMemo(
        () => (
            <Route path="/conference">
                <Box
                    overflow="hidden"
                    height="100%"
                    width={centerVisible ? leftSidebarWidthPc + "%" : "100%"}
                    maxWidth={centerVisible ? "350px" : undefined}
                    flex="1 0 300px"
                    mb="auto"
                    display={leftVisible ? "flex" : "none"}
                >
                    {left}
                </Box>
            </Route>
        ),
        [centerVisible, left, leftVisible]
    );

    const right = useMemo(
        () => (
            <Route
                path="/conference/:confSlug"
                component={(
                    props: RouteComponentProps<{
                        confSlug: string;
                    }>
                ) => <RightSidebar rootUrl={props.match.url} confSlug={props.match.params.confSlug} />}
            />
        ),
        []
    );
    const rightBar = useMemo(
        () => (
            <Route path="/conference">
                <Box
                    overflow="hidden"
                    height="100%"
                    width={centerVisible ? rightSidebarWidthPc + "%" : "100%"}
                    maxWidth={centerVisible ? "350px" : undefined}
                    flex="1 0 300px"
                    mb="auto"
                    ml="auto"
                    display={rightVisible ? "flex" : "none"}
                >
                    {right}
                </Box>
            </Route>
        ),
        [centerVisible, right, rightVisible]
    );

    const center = useMemo(() => <Routing />, []);
    const centerBar = useMemo(
        () => (
            <Box
                overflowX="hidden"
                overflowY="auto"
                height="100%"
                width={contentWidthPc + "%"}
                flex="1 0 300px"
                mb="auto"
                mt="0.4em"
                px="0.4em"
                position={centerVisible ? "relative" : "fixed"}
                top={centerVisible ? undefined : "100%"}
            >
                <VStack spacing={5} width="100%">
                    {center}
                    <Box h="40px" display="inline-block" flex="0 0 40px">
                        &nbsp;
                    </Box>
                </VStack>
            </Box>
        ),
        [contentWidthPc, centerVisible, center]
    );

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
                justifyContent="center"
                alignItems="center"
            >
                <MainMenu
                    isLeftBarOpen={leftVisible ?? false}
                    onLeftBarClose={() => setLeftOpen(false)}
                    onLeftBarOpen={() => setLeftOpen(true)}
                    isRightBarOpen={rightVisible ?? false}
                    onRightBarClose={() => {
                        setRightOpen(false);
                    }}
                    onRightBarOpen={() => {
                        if (!rightDefaultVisible) {
                            setLeftOpen(false);
                        }
                        setRightOpen(true);
                    }}
                >
                    <Flex w="100%" h="100%" overflow="hidden">
                        {leftBar}
                        {centerBar}
                        {rightBar}
                    </Flex>
                </MainMenu>
            </Flex>
        ),
        [centerBar, leftBar, leftVisible, rightBar, rightDefaultVisible, rightVisible]
    );
    return (
        <EmojiMartProvider>
            {/* <LastSeenProvider /> */}
            <CurrentUserProvider>{page}</CurrentUserProvider>
        </EmojiMartProvider>
    );
}

export default App;
