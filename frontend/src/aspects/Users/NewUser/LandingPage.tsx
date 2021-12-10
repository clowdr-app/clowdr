import { Box, ButtonGroup, Container, Flex, FormControl, Heading, Text } from "@chakra-ui/react";
import React from "react";
import { FormattedMessage } from "react-intl";
import LoginButton from "../../Auth/Buttons/LoginButton";
import SignupButton from "../../Auth/Buttons/SignUpButton";
import { ExternalLinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Utils/useTitle";
import Select, { StylesConfig } from 'react-select'

export default function NewUserLandingPage({ conferenceName }: { conferenceName?: string }): JSX.Element {
    
    const title = useTitle(conferenceName ?? "");

    const languages = [
        { value: 'en', label: 'English' },
        { value: 'pt', label: 'Português' },
        { value: 'de', label: 'Deutsch' },
    ]

    return (
        <>
            {title}
            <Box w="100%">
                <Flex
                    flexDir="column"
                    justifyContent="flex-end"
                    alignItems="center"
                    w="100%"
                    minH="50vh"
                    background="rgba(45,0,69,1)"
                    color="white"
                    pb={4}
                >
                    <Container textAlign={["center", "left"]} maxW="container.md">
                        <Heading
                            as="h1"
                            id="page-heading"
                            fontSize={["4xl", "5xl", "6xl"]}
                            fontWeight="normal"
                            textAlign={["center", "left"]}
                        >
                            <FormattedMessage id="users.newuser.landingpage.welcome" defaultMessage="Welcome to Midspace" description="greetings text" />
                        </Heading>
                        <Heading
                            mt={4}
                            mb={6}
                            as="h2"
                            id="page-heading"
                            fontSize={["2xl", "3xl", "4xl"]}
                            fontWeight="thin"
                            textAlign={["center", "left"]}
                        >
                            <FormattedMessage
                                id="users.newuser.landingpage.description"
                                defaultMessage="Accessible virtual and hybrid conferences."
                                description="description text"
                            />
                        </Heading>
                        <ExternalLinkButton
                            to="https://midspace.app"
                            colorScheme="pink"
                            size="lg"
                            linkProps={{ "aria-label": "Learn more about Midspace on our marketing website" }}
                        >
                            <FormattedMessage id="users.newuser.landingpage.learnmore" defaultMessage="Learn more" description="learn more text" />
                        </ExternalLinkButton>
                    </Container>
                </Flex>
                <Flex
                    flexDir="column"
                    justifyContent="flex-start"
                    alignItems="center"
                    w="100%"
                    minH="50vh"
                    background="rgba(185,9,91,1)"
                    color="white"
                    pt={4}
                >
                    <Container textAlign={["center", "right"]} maxW="container.sm">
                        <FormControl>
                            <Text fontSize="lg" fontWeight="normal" margin={0} lineHeight="revert" mb={4}>
                                <FormattedMessage
                                    id="users.newuser.landingpage.signin"
                                    defaultMessage="Please sign up or log in to use Midspace."
                                    description="sign in text"
                                />
                            </Text>
                            <ButtonGroup spacing={4}>
                                <SignupButton size="lg" colorScheme="purple" />
                                <LoginButton size="lg" colorScheme="purple" />
                            </ButtonGroup>
                        </FormControl>
                    </Container>
                    <Container maxW="container.sm" marginTop="3vh">
                        {/* <Select 
                            options={languages}
                            defaultValue={languages[0]}
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                },
                            })}
                        /> */}
                    </Container>
                </Flex>
            </Box>
        </>
    );
}
