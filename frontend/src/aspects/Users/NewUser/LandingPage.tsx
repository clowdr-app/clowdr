import { Box, ButtonGroup, Container, Flex, FormControl, Heading, Text } from "@chakra-ui/react";
import React from "react";
import LoginButton from "../../Auth/Buttons/LoginButton";
import SignupButton from "../../Auth/Buttons/SignUpButton";
import { ExternalLinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Utils/useTitle";

export default function NewUserLandingPage({ conferenceName }: { conferenceName?: string }): JSX.Element {
    const title = useTitle(conferenceName ?? "");

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
                            Welcome to Midspace
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
                            Accessible virtual and hybrid conferences.
                        </Heading>
                        <ExternalLinkButton
                            to="https://midspace.app"
                            colorScheme="blue"
                            size="lg"
                            linkProps={{ "aria-label": "Learn more about Midspace on our marketing website" }}
                        >
                            Learn more
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
                                Please sign up or log in to use Midspace.
                            </Text>
                            <ButtonGroup spacing={4}>
                                <SignupButton size="lg" colorScheme="purple" />
                                <LoginButton size="lg" colorScheme="purple" />
                            </ButtonGroup>
                        </FormControl>
                    </Container>
                </Flex>
            </Box>
        </>
    );
}
