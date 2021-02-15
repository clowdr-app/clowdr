import { Center, createStandaloneToast, Spinner } from "@chakra-ui/react";
import { detect } from "detect-browser";
import React from "react";

const browser = detect();
const browserOK = !(
    !browser ||
    (browser.name.includes("safari") && (!browser.version || parseInt(browser.version, 10) >= 14)) ||
    browser.name === "ios" ||
    browser.name === "ios-webview"
);

const toast = createStandaloneToast();
if (!browserOK) {
    toast({
        description: `Your browser (${
            browser?.name ?? "unknown browser"
        }) is officially Unsupported. We expect Clowdr to be unusable in your browser. Please switch to using a supported browser: Firefox, Chrome, Edge or Opera.`,
        isClosable: false,
        duration: 60 * 60 * 1000,
        position: "top",
        status: "error",
        title: "Browser not supported",
    });
}

export default function AppLoadingScreen(): JSX.Element {
    return (
        <Center w="100%" h="100%">
            {!browserOK ? (
                <div>
                    Your browser ({browser?.name ?? "unknown browser"}) is officially Unsupported. We expect Clowdr to
                    be unusable in your browser. Please switch to using a supported browser: Firefox, Chrome, Edge or
                    Opera.
                </div>
            ) : (
                <div>
                    <Spinner />
                </div>
            )}
        </Center>
    );
}
