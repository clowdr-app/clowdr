import { Heading } from "@chakra-ui/react";
import React from "react";
import { Twemoji } from "react-emoji-render";
import { useChatConfiguration } from "../Configuration";

export function HeadingText(): JSX.Element {
    const config = useChatConfiguration();

    return (
        <Heading as="h1" fontSize="sm" textAlign="left" fontWeight="600" p={1} flex="1">
            <Twemoji className="twemoji" text={config.state.Name} />
        </Heading>
    );
}
