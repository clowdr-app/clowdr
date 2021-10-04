import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Link,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import {
    useSelectEventStreamTextEventIdQuery,
    useUpdateEventStreamTextEventIdMutation,
} from "../../../../generated/graphql";

gql`
    query SelectEventStreamTextEventId($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            streamTextEventId
        }
    }

    mutation UpdateEventStreamTextEventId($eventId: uuid!, $streamTextEventId: String) {
        update_schedule_Event_by_pk(pk_columns: { id: $eventId }, _set: { streamTextEventId: $streamTextEventId }) {
            id
            streamTextEventId
        }
    }
`;

export default function EditStreamTextIntegration({ eventId }: { eventId: string }): JSX.Element {
    const response = useSelectEventStreamTextEventIdQuery({
        variables: {
            eventId,
        },
        fetchPolicy: "no-cache",
    });
    return response.loading && !response.data ? (
        <Spinner />
    ) : (
        <EditStreamTextIntegrationInner
            eventId={eventId}
            outerValue={response.data?.schedule_Event_by_pk?.streamTextEventId}
        />
    );
}

function EditStreamTextIntegrationInner({
    eventId,
    outerValue,
}: {
    eventId: string;
    outerValue: string | null | undefined;
}): JSX.Element {
    const [initialValue, setInitialValue] = useState<string | null>(outerValue ?? null);
    const [value, setValue] = useState<string | null>(initialValue);

    const [updateMutation, updateResponse] = useUpdateEventStreamTextEventIdMutation();
    const update = useCallback(
        (newValue: string | null) => {
            setValue(newValue);
            setInitialValue(newValue);

            if (newValue !== initialValue) {
                updateMutation({
                    variables: {
                        eventId,
                        streamTextEventId: newValue?.trim() === "" ? null : newValue,
                    },
                });
            }
        },
        [eventId, initialValue, updateMutation]
    );

    return (
        <VStack spacing={4} alignItems="flex-start">
            <Text>
                StreamText is a 3rd party service for delivering real-time live captions. If you have a StreamText
                account you can configure an event and input your event id below. This will embed the StreamText feed
                within Midspace during this event.
            </Text>
            <Text>
                Learn more at{" "}
                <Link href="https://streamtext.net" isExternal>
                    StreamText.Net
                    <sup>
                        <ExternalLinkIcon />
                    </sup>
                </Link>
                .
            </Text>
            <Text fontSize="xs">
                The Midspace platform and software are not affiliated with StreamText.Net in any way. We cannot provide
                support with your StreamText feed. We are not responsible for any issue caused by StreamText software
                embedded within this site.
            </Text>
            <FormControl>
                <FormLabel>StreamText Event Id</FormLabel>
                <Input
                    value={value ?? ""}
                    onChange={(ev) => {
                        setValue(ev.target.value);
                    }}
                />
                <FormHelperText>
                    The event id obtained from StreamText. This is just the id, not the full URL. Leave blank to remove
                    the integration.
                </FormHelperText>
            </FormControl>
            <ButtonGroup>
                <Button
                    colorScheme="pink"
                    onClick={() => {
                        update(null);
                    }}
                    isDisabled={updateResponse.loading || value === null}
                >
                    Clear
                </Button>
                <Button
                    colorScheme="gray"
                    onClick={() => {
                        update(initialValue);
                    }}
                    isDisabled={updateResponse.loading || value === initialValue}
                >
                    Reset
                </Button>
                <Button
                    colorScheme="purple"
                    onClick={() => {
                        update(value);
                    }}
                    isDisabled={value === initialValue}
                    isLoading={updateResponse.loading}
                >
                    Save
                </Button>
            </ButtonGroup>
            {updateResponse.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error saving changes</AlertTitle>
                    <AlertDescription>{updateResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
        </VStack>
    );
}
