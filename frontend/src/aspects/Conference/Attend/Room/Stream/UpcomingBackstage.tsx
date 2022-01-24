import { Alert, AlertDescription, AlertIcon, AlertTitle, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { Room_EventSummaryFragment } from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import { formatRemainingTime } from "../formatRemainingTime";
import { FormattedMessage } from "react-intl";

export function UpcomingBackstageBanner({ event }: { event: Room_EventSummaryFragment }): JSX.Element {
    const startTime = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const now = useRealTime(1000);
    const timeRemaining = (startTime + 5000 - now - 20 * 60 * 1000) / 1000;

    const title = useMemo(() => {
        if (event.item) {
            if (event.item.title.toLowerCase().includes(event.name.toLowerCase())) {
                return event.item.title;
            } else {
                return event.name + ": " + event.item.title;
            }
        } else {
            return event.name;
        }
    }, [event.item, event.name]);

    return timeRemaining > 0 ? (
        <Alert status="info" alignItems="flex-start" pos="sticky" top={0} zIndex={10000}>
            <AlertIcon />
            <VStack alignItems="start">
                <AlertTitle>
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.UpcomingBackstage.Timer"
                        defaultMessage="{time} until your backstage is available"
                        values={{
                            time: formatRemainingTime(timeRemaining)
                        }}
                    />
                </AlertTitle>
                <AlertDescription>
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.UpcomingBackstage.WillBeAvaiable"
                        defaultMessage="Your backstage for {title} will become available on this page. You will automatically be shown the
                        backstage 20 minutes in advance of the live period of your event."
                        values={{
                            title: title
                        }}
                    />
                    
                </AlertDescription>
            </VStack>
        </Alert>
    ) : (
        <></>
    );
}
