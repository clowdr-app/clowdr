import { useApolloClient } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Center,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { pushNotificationsState } from "./PushNotificationsState";

export default function PushNotificationSettings(): JSX.Element {
    const [isSubscribed, setIsSubscribed] = useState<boolean | string | null>(null);
    const apolloClient = useApolloClient();

    useEffect(() => {
        const unsub = pushNotificationsState.onIsSubscribed((isSub) => {
            setIsSubscribed(isSub);
        });

        return () => {
            unsub();
        };
    }, []);

    return (
        <Center as={VStack} flexDir="column" spacing={8} maxW={600}>
            {isSubscribed === null ? (
                <>
                    <Text>Determining subscription state for this browser...</Text>
                    <Box>
                        <Spinner />
                    </Box>
                </>
            ) : isSubscribed && typeof isSubscribed === "string" ? (
                <>
                    <Text>Error handling subscription</Text>
                    <Text>{isSubscribed}</Text>
                </>
            ) : isSubscribed ? (
                <>
                    <Text>You are subscribed to push notifications in this browser.</Text>
                    <Button
                        onClick={() => {
                            pushNotificationsState.unsubscribe(apolloClient);
                        }}
                    >
                        Unsubscribe
                    </Button>
                </>
            ) : (
                <>
                    <Text>You are not currently subscribed to push notifications in this browser.</Text>
                    <Button
                        onClick={() => {
                            pushNotificationsState.subscribe(apolloClient);
                        }}
                    >
                        Subscribe
                    </Button>
                </>
            )}
            <Alert variant="subtle" status="warning" alignItems="flex-start">
                <AlertIcon mt={1} />
                <Box flex="1">
                    <AlertTitle mb={2}>
                        Please note, push notifications are only supported in Firefox, Chrome, Edge and Opera on
                        desktop, laptop and Android devices.
                    </AlertTitle>
                    <AlertDescription as={VStack}>
                        <Text>
                            Due to Apple&apos;s decision to obstruct open web standards, by refusing to implement the
                            Push API, Clowdr does not support push notifications in Safari nor any browser on iOS.
                        </Text>
                        <Text fontStyle="italic">
                            (Don&apos;t be fooled: all iOS browser apps have to use Apple&apos;s web engine, including
                            Firefox and Chrome. Your browser may not be what you think it is.)
                        </Text>
                    </AlertDescription>
                </Box>
            </Alert>
        </Center>
    );
}
