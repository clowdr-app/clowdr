import {
    Alert,
    AlertDescription,
    AlertTitle,
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Text,
    Textarea,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { gql } from "urql";
import { useUpsertConferenceThemeMutation } from "../../../../generated/graphql";
import { useConferenceTheme } from "../../../Chakra/ChakraCustomProvider";
import defaultTheme from "../../../Chakra/Colors/ComponentMap";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";

gql`
    mutation UpsertConferenceTheme($conferenceId: uuid!, $value: jsonb!) {
        insert_conference_Configuration_one(
            object: { conferenceId: $conferenceId, key: THEME_COMPONENT_COLORS, value: $value }
            on_conflict: { constraint: Configuration_pkey, update_columns: [value] }
        ) {
            conferenceId
            key
            value
        }
    }
`;

export default function ManageShuffle(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage theme of ${conference.shortName}`);

    const { theme, setTheme } = useConferenceTheme();
    const [error, setError] = useState<string | null>(null);
    const [value, setValue] = useState<string | null>(null);

    useEffect(() => {
        if (theme && !value) {
            setValue(JSON.stringify(theme ?? defaultTheme, null, 4));
        }
    }, [theme, value]);

    const applyTheme = useCallback(() => {
        if (value) {
            try {
                setError(null);
                const parsedValue = JSON.parse(value);
                setTheme(parsedValue);
                return parsedValue;
            } catch (e: any) {
                setError(e.toString());
            }
        }
        return undefined;
    }, [setTheme, value]);
    useEffect(() => {
        setError(null);

        const id = setTimeout(
            (() => {
                applyTheme();
            }) as TimerHandler,
            5000
        );

        return () => {
            clearTimeout(id);
        };
    }, [applyTheme]);

    const [saveThemeResponse, saveTheme] = useUpsertConferenceThemeMutation();

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Theme
            </Heading>
            <Text>
                After saving your changes, please refresh the page and navigate around the attendee pages to confirm the
                theme is okay.
            </Text>
            {saveThemeResponse.error ? (
                <Alert status="error" flexDir="column" alignItems="flex-start">
                    <AlertTitle>Error saving theme</AlertTitle>
                    <AlertDescription>{saveThemeResponse.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            {error ? (
                <Alert status="error" flexDir="column" alignItems="flex-start">
                    <AlertTitle>Theme invalid</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : undefined}
            <FormControl>
                <FormLabel>Theme</FormLabel>
                <FormHelperText my={2}>
                    A preview of your theme will be applied 5s after you stop typing.
                </FormHelperText>
                <FormHelperText my={2}>
                    The theme is described as a JSON object. Please follow the existing pattern to modify your theme. In
                    future we will be offering an easier to use graphical editor.
                </FormHelperText>
                <Textarea
                    minH="70vh"
                    value={value ?? JSON.stringify(defaultTheme, null, 4)}
                    onChange={(ev) => {
                        setValue(ev.target.value);
                    }}
                />
            </FormControl>
            <ButtonGroup>
                <Button
                    colorScheme="DestructiveActionButton"
                    isDisabled={saveThemeResponse.fetching}
                    onClick={() => {
                        setValue(JSON.stringify(theme ?? defaultTheme, null, 4));
                        saveTheme(
                            {
                                conferenceId: conference.id,
                                value: theme ?? defaultTheme,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        "X-Auth-Role": "main-conference-organizer",
                                    },
                                },
                            }
                        );
                    }}
                >
                    Reset to original
                </Button>
                <Button
                    colorScheme="DestructiveActionButton"
                    isDisabled={saveThemeResponse.fetching}
                    onClick={() => {
                        setValue(JSON.stringify(defaultTheme, null, 4));
                        saveTheme(
                            {
                                conferenceId: conference.id,
                                value: defaultTheme,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        "X-Auth-Role": "main-conference-organizer",
                                    },
                                },
                            }
                        );
                    }}
                >
                    Reset to default
                </Button>
                <Button
                    colorScheme="ConfirmButton"
                    isLoading={saveThemeResponse.fetching}
                    onClick={() => {
                        const value = applyTheme();
                        if (value) {
                            saveTheme(
                                {
                                    conferenceId: conference.id,
                                    value,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "main-conference-organizer",
                                        },
                                    },
                                }
                            );
                        }
                    }}
                >
                    Save
                </Button>
            </ButtonGroup>
        </RequireRole>
    );
}
