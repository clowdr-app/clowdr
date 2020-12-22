import { Heading, Stack, StackDivider, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import InviteCodeInput from "../Users/NewUser/InviteCodeInput";
import NewConferenceForm from "./NewConferenceForm";

export default function UseInviteOrCreateView(): JSX.Element {
    const useInviteEl = (
        <VStack
            width={["100%", "100%", "50%"]}
            flexDirection="column"
            justifyContent="start"
            alignItems="center"
            spacing={5}
        >
            <Heading as="h1">Join a conference</Heading>
            <InviteCodeInput />
            {/* TODO: Show a "Find a (public) conference" button */}
        </VStack>
    );
    const newConferenceEl = (
        <VStack
            width={["100%", "100%", "50%"]}
            flexDirection="column"
            justifyContent="start"
            alignItems="center"
            spacing={5}
        >
            <Heading as="h1">Create a conference</Heading>
            <NewConferenceForm />
        </VStack>
    );
    const dividerColor = useColorModeValue("gray.200", "gray.700");
    return (
        <Stack
            direction={["column", "column", "row"]}
            spacing={["2em", "2em", "4em"]}
            width="100%"
            maxWidth="1000px"
            divider={<StackDivider orientation={["horizontal", "vertical"]} borderColor={dividerColor} />}
        >
            {useInviteEl}
            {newConferenceEl}
        </Stack>
    );
}
