import { Alert, AlertIcon, AlertTitle, Heading, SkeletonText } from "@chakra-ui/react";
import React from "react";
import { useChatConfiguration } from "../Configuration";
import { useChatTitleQuery } from "./TitleQuery";

export function HeadingText(): JSX.Element {
    const config = useChatConfiguration();
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
        <Heading as="h1" fontSize="1.2em" fontWeight="600" p={config.spacing}>
            {titleQ.data}
        </Heading>
    );
}
