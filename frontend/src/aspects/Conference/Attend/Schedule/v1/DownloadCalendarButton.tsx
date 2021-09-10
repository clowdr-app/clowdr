import { Button, ButtonProps, useToast } from "@chakra-ui/react";
import ics, { EventAttributes } from "ics";
import React from "react";
import FAIcon from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import type { TimelineEvent } from "./DayList";

export default function DownloadCalendarButton({
    events,
    calendarName,
    ...props
}: {
    events: () => ReadonlyArray<TimelineEvent>;
    calendarName: string;
} & ButtonProps): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    return (
        <Button
            aria-label="Download calendar file"
            colorScheme="purple"
            {...props}
            onClick={() => {
                const convertedEvents: EventAttributes[] = events().map((event) => {
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(Date.parse(event.startTime) + event.durationSeconds * 1000);
                    return {
                        uid: event.id + "@" + window.location.hostname,
                        title: event.item ? `${event.item.title} (${event.name})` : event.name,
                        url: `${window.location.origin}/conference/${conference.slug}/room/${event.roomId}`,
                        location: `${window.location.origin}/conference/${conference.slug}/room/${event.roomId}`,
                        start: [
                            startTime.getUTCFullYear(),
                            startTime.getUTCMonth() + 1,
                            startTime.getUTCDate(),
                            startTime.getUTCHours(),
                            startTime.getUTCMinutes(),
                        ],
                        startInputType: "utc",
                        end: [
                            endTime.getUTCFullYear(),
                            endTime.getUTCMonth() + 1,
                            endTime.getUTCDate(),
                            endTime.getUTCHours(),
                            endTime.getUTCMinutes(),
                        ],
                        endInputType: "utc",
                        calName: conference.shortName + ": " + calendarName,
                        busyStatus: "BUSY",
                        alarms: [
                            {
                                action: "display",
                                trigger: {
                                    before: true,
                                    minutes: 15,
                                },
                            },
                        ],
                    };
                });
                const { error, value } = ics.createEvents(convertedEvents);
                if (error) {
                    toast({
                        description: error.name + ": " + error.message,
                        title: "Error generating calendar",
                        duration: 15000,
                        isClosable: true,
                        position: "top",
                        status: "error",
                    });
                } else if (value) {
                    const dataBlob = new Blob([value], { type: "text/calendar;charset=utf-8;" });
                    let fileURL: string | null = null;
                    const now = new Date();
                    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                        .getDate()
                        .toString()
                        .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")} - ${conference.shortName} - ${calendarName}.ics`;
                    if (navigator.msSaveBlob) {
                        navigator.msSaveBlob(dataBlob, fileName);
                    } else {
                        fileURL = window.URL.createObjectURL(dataBlob);
                    }

                    const tempLink = document.createElement("a");
                    tempLink.href = fileURL ?? "";
                    tempLink.setAttribute("download", fileName);
                    tempLink.click();
                }
            }}
        >
            <FAIcon iconStyle="s" icon="file-download" mr={2} />
            Download calendar
        </Button>
    );
}
