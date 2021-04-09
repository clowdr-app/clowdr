import { Box, Button, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { pushNotificationsState } from "./PushNotificationsState";

export default function PushNotificationSettings(): JSX.Element {
    const [isSubscribed, setIsSubscribed] = useState<boolean | string | null>(null);

    useEffect(() => {
        const unsub = pushNotificationsState.onIsSubscribed((isSub) => {
            setIsSubscribed(isSub);
        });

        return () => {
            unsub();
        };
    }, []);

    return isSubscribed === null ? (
        <Center as={VStack} flexDir="column" spacing={4}>
            <Text>Determining subscription state for this browser...</Text>
            <Box>
                <Spinner />
            </Box>
        </Center>
    ) : isSubscribed && typeof isSubscribed === "string" ? (
        <Center as={VStack} flexDir="column" spacing={4}>
            <Text>Error handling subscription</Text>
            <Text>{isSubscribed}</Text>
        </Center>
    ) : isSubscribed ? (
        <Center as={VStack} flexDir="column" spacing={4}>
            <Text>You are subscribed to push notifications in this browser.</Text>
            <Button
                onClick={() => {
                    pushNotificationsState.unsubscribe();
                }}
            >
                Unsubscribe
            </Button>
        </Center>
    ) : (
        <Center as={VStack} flexDir="column" spacing={4}>
            <Text>You are not currently subscribed to push notifications in this browser.</Text>
            <Button
                onClick={() => {
                    pushNotificationsState.subscribe();
                }}
            >
                Subscribe
            </Button>
        </Center>
    );
}
