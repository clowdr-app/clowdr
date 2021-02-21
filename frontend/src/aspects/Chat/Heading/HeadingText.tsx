import { Alert, AlertIcon, AlertTitle, Heading, SkeletonText } from "@chakra-ui/react";
import React from "react";
import { Twemoji } from "react-emoji-render";
import { useChatTitleQuery } from "./TitleQuery";

export function HeadingText(): JSX.Element {
    const titleQ = useChatTitleQuery();

    if (titleQ.loading) {
        return <SkeletonText />;
    }

    if (titleQ.error) {
        return (
            <Alert>
                <AlertIcon />
                <AlertTitle>Failed to load chat title.</AlertTitle>
            </Alert>
        );
    }

    return (
        <Heading as="h1" fontSize="sm" textAlign="left" fontWeight="600" p={1} flex="1">
            <Twemoji className="twemoji" text={titleQ.data} />
        </Heading>
    );
}
