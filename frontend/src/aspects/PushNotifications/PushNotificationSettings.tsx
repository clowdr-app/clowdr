import { useApolloClient } from "@apollo/client";
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
import { pushNotificationsState } from "./PushNotificationsState";
import { FormattedMessage } from "react-intl";

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
                    <Text>
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.determiningsubscriptionstate"
                            defaultMessage="Determining subscription state for this browser..."
                        />
                    </Text>
                    <Box>
                        <Spinner />
                    </Box>
                </>
            ) : isSubscribed && typeof isSubscribed === "string" ? (
                <>
                    <Text>
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.errorhandlingsubscription"
                            defaultMessage="Error handling subscription"
                        />
                    </Text>
                    <Text>{isSubscribed}</Text>
                </>
            ) : isSubscribed ? (
                <>
                    <Text>
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.youresubscribed"
                            defaultMessage="You are subscribed to push notifications in this browser."
                        />
                    </Text>
                    <Button
                        onClick={() => {
                            pushNotificationsState.unsubscribe(apolloClient);
                        }}
                    >
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.unsubscribe"
                            defaultMessage="Unsubscribe"
                        />
                    </Button>
                </>
            ) : (
                <>
                    <Text>
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.notsubscribed"
                            defaultMessage="You are not currently subscribed to push notifications in this browser."
                        />
                    </Text>
                    <Button
                        onClick={() => {
                            pushNotificationsState.subscribe(apolloClient);
                        }}
                    >
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.subscribe"
                            defaultMessage="Subscribe"
                        />
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
                            <FormattedMessage
                                id="pushnotifications.pushnotificationsettings.instructionsforenabling"
                                defaultMessage="Instructions for enabling alerts:"
                            />{" "}
                            <Link isExternal href="https://support.apple.com/en-us/HT204079">
                                https://support.apple.com/en-us/HT204079
                            </Link>
                        </Text>
                        <Text>
                            <FormattedMessage
                                id="pushnotifications.pushnotificationsettings.instructionsmac1"
                                defaultMessage="Mac users will need to allow their browser to show notifications via the operating system's Control Center settings."
                            />
                        </Text>
                        <Text>
                            <FormattedMessage
                                id="pushnotifications.pushnotificationsettings.instructionsmac2"
                                defaultMessage="Please also remember that if you have Do Not Disturb mode on (which is often automatically enabled when you have a second screen plugged in), notifications will be suppressed by the operating system."
                            />
                        </Text>
                    </AlertDescription>
                </Box>
            </Alert>
            <Alert variant="subtle" status="info" alignItems="flex-start">
                <AlertIcon mt={1} />
                <Box flex="1">
                    <AlertTitle mb={2}>
                        <FormattedMessage
                            id="pushnotifications.pushnotificationsettings.browserssupported"
                            defaultMessage="Please note, push notifications are only supported in Firefox, Chrome, Edge and Opera on desktop, laptop and Android devices."
                        />
                    </AlertTitle>
                    <AlertDescription as={VStack}>
                        <Text>
                            <FormattedMessage
                                id="pushnotifications.pushnotificationsettings.applerant1"
                                defaultMessage="Apple's decision to obstruct open web standards, by refusing to implement the Push API,prevents Midspace from supporting push notifications in Safari and all browsers on iOS."
                            />
                            
                        </Text>
                        <Text fontStyle="italic">
                            <FormattedMessage
                                id="pushnotifications.pushnotificationsettings.applerant2"
                                defaultMessage="(Don't be fooled: all iOS browser apps have to use Apple's web engine, including Firefox and Chrome. Your browser may not be what you think it is.)"
                            />
                        </Text>
                    </AlertDescription>
                </Box>
            </Alert>
        </Center>
    );
}
