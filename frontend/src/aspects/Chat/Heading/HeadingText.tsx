import { Heading } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import React from "react";
import { Twemoji } from "react-emoji-render";
import { useChatConfiguration } from "../Configuration";

export function HeadingText(): JSX.Element {
    const config = useChatConfiguration();
    assert.truthy(
        config.state?.Name !== undefined,
        "config.state is null. Chat state is not available in the current context."
    );

    return (
        <Heading as="h1" fontSize="sm" textAlign="left" fontWeight="600" p={1} flex="1">
            <Twemoji className="twemoji" text={config.state.Name} />
        </Heading>
    );
}
