import { WarningTwoIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Center,
    Link,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useClient } from "urql";
import { pushNotificationsState } from "./PushNotificationsState";

export default function PushNotificationSettings(): JSX.Element {
    const [isSubscribed, setIsSubscribed] = useState<boolean | string | null>(null);
    const client = useClient();

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
                            pushNotificationsState.unsubscribe(client);
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
                            pushNotificationsState.subscribe(client);
                        }}
                    >
                        Subscribe
                    </Button>
                </>
            )}
            <Alert variant="subtle" status="warning" alignItems="flex-start">
                <AlertIcon as={WarningTwoIcon} mt={1} />
                <Box flex="1">
                    <AlertTitle mb={2}>
                        <em>Mac users:</em> Remember to allow &ldquo;Alerts&rdquo; in your System Preferences
                    </AlertTitle>
                    <AlertDescription as={VStack}>
                        <Text>
                            Instructions for enabling alerts:{" "}
                            <Link isExternal href="https://support.apple.com/en-us/HT204079">
                                https://support.apple.com/en-us/HT204079
                            </Link>
                        </Text>
                        <Text>
                            Mac users will need to{" "}
                            <Link isExternal href="https://support.apple.com/en-us/HT204079">
                                allow their browser to show notifications via the operating system&apos;s Control Center
                                settings.
                            </Link>
                        </Text>
                        <Text>
                            Please also remember that if you have Do Not Disturb mode on (which is often automatically
                            enabled when you have a second screen plugged in), notifications will be suppressed by the
                            operating system.
                        </Text>
                    </AlertDescription>
                </Box>
            </Alert>
            <Alert variant="subtle" status="info" alignItems="flex-start">
                <AlertIcon mt={1} />
                <Box flex="1">
                    <AlertTitle mb={2}>
                        Please note, push notifications are only supported in Firefox, Chrome, Edge and Opera on
                        desktop, laptop and Android devices.
                    </AlertTitle>
                    <AlertDescription as={VStack}>
                        <Text>
                            Apple&apos;s decision to obstruct open web standards, by refusing to implement the Push API,
                            prevents Midspace from supporting push notifications in Safari and all browsers on iOS.
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
