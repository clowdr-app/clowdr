import { gql } from "@apollo/client";
import { EditIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    IconButton,
    Input,
    InputGroup,
    InputLeftAddon,
    Link,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Spinner,
    Text,
    Textarea,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useAttendeeByIdQuery,
    useUpdateAttendeeDisplayNameMutation,
    useUpdateAttendeeProfileMutation,
} from "../../../../generated/graphql";
import BadgeInput from "../../../Badges/BadgeInput";
import type { BadgeData } from "../../../Badges/ProfileBadge";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import UnsavedChangesWarning from "../../../LeavingPageWarnings/UnsavedChangesWarning";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import PronounInput from "../../../Pronouns/PronounInput";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import { AttendeeContextT, AttendeeProfile, useMaybeCurrentAttendee } from "../../useCurrentAttendee";
import EditProfilePitureForm from "./EditProfilePictureForm";

function arraysEqual<T>(
    x: T[] | null | undefined,
    y: T[] | null | undefined,
    sort: (a: T, b: T) => number,
    compare: (a: T, b: T) => boolean
) {
    if (!x || !y) {
        if (!x && !y) {
            return true;
        }
        if ((x && x.length === 0) || (y && y.length === 0)) {
            return true;
        }
        return false;
    }
    const sortedY = [...y].sort(sort);
    return x.length === y.length && [...x].sort(sort).every((v, idx) => compare(v, sortedY[idx]));
}

function deepProfileIsEqual(x: AttendeeContextT, y: AttendeeContextT): boolean {
    return (
        x.profile.realName === y.profile.realName &&
        x.profile.affiliation === y.profile.affiliation &&
        x.profile.affiliationURL === y.profile.affiliationURL &&
        x.profile.country === y.profile.country &&
        x.profile.timezoneUTCOffset === y.profile.timezoneUTCOffset &&
        x.profile.bio === y.profile.bio &&
        x.profile.website === y.profile.website &&
        x.profile.github === y.profile.github &&
        x.profile.twitter === y.profile.twitter &&
        arraysEqual<BadgeData>(
            x.profile.badges,
            y.profile.badges,
            (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            (a, b) => a.name.toLowerCase() === b.name.toLowerCase() && a.colour === b.colour
        ) &&
        arraysEqual<string>(
            x.profile.pronouns,
            y.profile.pronouns,
            (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
            (a, b) => a.toLowerCase() === b.toLowerCase()
        )
    );
}

gql`
    mutation UpdateAttendeeProfile($attendeeId: uuid!, $profile: AttendeeProfile_set_input = {}) {
        update_AttendeeProfile_by_pk(pk_columns: { attendeeId: $attendeeId }, _set: $profile) {
            attendeeId
        }
    }

    mutation UpdateAttendeeDisplayName($attendeeId: uuid!, $name: String!) {
        update_Attendee_by_pk(pk_columns: { id: $attendeeId }, _set: { displayName: $name }) {
            id
        }
    }
`;

function EditProfilePageInner({ attendee }: { attendee: AttendeeContextT }): JSX.Element {
    const conference = useConference();
    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    const currentUser = useCurrentUser();
    useEffect(() => {
        setPrimaryMenuButtons([
            {
                key: "conference-home",
                action: `/conference/${conference.slug}`,
                text: conference.shortName,
                label: conference.shortName,
            },
            {
                key: "view-profile",
                action:
                    attendee.userId === currentUser.user.id
                        ? `/conference/${conference.slug}/profile/view`
                        : `/conference/${conference.slug}/profile/view/${attendee.id}`,
                text: "View profile",
                label: "View profile",
                colorScheme: "green",
            },
        ]);
    }, [
        attendee.id,
        attendee.userId,
        conference.shortName,
        conference.slug,
        currentUser.user.id,
        setPrimaryMenuButtons,
    ]);

    const [editingAttendee, setEditingAttendee] = useState<AttendeeContextT>(attendee);

    const isDirty = useMemo(() => !deepProfileIsEqual(attendee, editingAttendee), [attendee, editingAttendee]);
    const displayNameIsDirty = editingAttendee.displayName !== attendee.displayName;

    const [
        updateAttendeeProfile,
        { loading: loadingUpdateAttendeProfile, error: errorUpdateAttendeeProfile },
    ] = useUpdateAttendeeProfileMutation();
    const [
        updateAttendeeDisplayName,
        { loading: loadingUpdateAttendeDisplayName, error: errorUpdateAttendeeDisplayName },
    ] = useUpdateAttendeeDisplayNameMutation();

    const toast = useToast();
    const savingToastIdRef = useRef<string | number | undefined>();

    const closeSavingToast = useCallback(() => {
        if (savingToastIdRef.current !== undefined) {
            toast.close(savingToastIdRef.current);
            savingToastIdRef.current = undefined;
        }
    }, [toast]);

    const showSavingToast = useCallback(() => {
        if (savingToastIdRef.current === undefined) {
            savingToastIdRef.current = toast({
                position: "top",
                description: (
                    <>
                        <Spinner mr={4} />
                        <Text as="span">Saving changes…</Text>
                    </>
                ),
                status: "info",
            });
        }
    }, [toast]);

    useEffect(() => {
        let tId: number | undefined;
        if (isDirty || loadingUpdateAttendeDisplayName || loadingUpdateAttendeProfile) {
            tId = setTimeout(showSavingToast as TimerHandler, 1000);
        } else {
            closeSavingToast();
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [closeSavingToast, isDirty, loadingUpdateAttendeDisplayName, loadingUpdateAttendeProfile, showSavingToast]);

    useEffect(() => {
        let tId: number | undefined;
        if (isDirty) {
            tId = setTimeout(
                (async () => {
                    try {
                        await updateAttendeeProfile({
                            variables: {
                                attendeeId: attendee.id,
                                profile: {
                                    realName: editingAttendee.profile.realName,
                                    affiliation: editingAttendee.profile.affiliation,
                                    affiliationURL: editingAttendee.profile.affiliationURL,
                                    country: editingAttendee.profile.country,
                                    timezoneUTCOffset: editingAttendee.profile.timezoneUTCOffset,
                                    bio: editingAttendee.profile.bio,
                                    website: editingAttendee.profile.website,
                                    github: editingAttendee.profile.github,
                                    twitter: editingAttendee.profile.twitter,
                                    badges: editingAttendee.profile.badges,
                                    pronouns: editingAttendee.profile.pronouns,
                                    hasBeenEdited: true,
                                },
                            },
                        });
                        await attendee.refetch();
                    } catch (e) {
                        console.error("Error saving profile", e);
                    }
                }) as TimerHandler,
                3000
            );
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [
        attendee,
        editingAttendee.displayName,
        editingAttendee.profile,
        isDirty,
        updateAttendeeDisplayName,
        updateAttendeeProfile,
    ]);

    const textField = useCallback(
        (
            fieldName: keyof {
                [K in keyof AttendeeProfile]: AttendeeProfile[K] extends string | number ? AttendeeProfile[K] : never;
            },
            title: string,
            type?: string,
            leftAddon?: string,
            stripPrefixes?: string[]
        ) => {
            const v = editingAttendee.profile[fieldName] as string | number | undefined;
            return (
                <FormControl>
                    <FormLabel fontWeight="bold" fontSize="1.2rem">
                        {title}
                    </FormLabel>
                    {type === "number" || type === "timezone" ? (
                        <InputGroup>
                            {leftAddon ? <InputLeftAddon>{leftAddon}</InputLeftAddon> : undefined}
                            <NumberInput
                                min={type === "timezone" ? -12 : undefined}
                                max={type === "timezone" ? +12 : undefined}
                                precision={1}
                                allowMouseWheel
                                value={(v as number | undefined)?.toFixed(1) ?? 0}
                                step={0.5}
                                onChange={(_vvv, v) => {
                                    setEditingAttendee({
                                        ...editingAttendee,
                                        profile: {
                                            ...editingAttendee.profile,
                                            [fieldName]: type === "timezone" ? Math.round(v * 2) / 2 : v,
                                        },
                                    });
                                }}
                                pattern="-?[0-9]*(.[0-9]+)?"
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </InputGroup>
                    ) : type === "textarea" ? (
                        <>
                            <Textarea
                                transition="none"
                                value={v ?? ""}
                                onChange={(ev) => {
                                    setEditingAttendee({
                                        ...editingAttendee,
                                        profile: {
                                            ...editingAttendee.profile,
                                            [fieldName]: ev.target.value,
                                        },
                                    });
                                }}
                            />
                            <FormHelperText>
                                Use{" "}
                                <Link isExternal href="https://www.markdownguide.org/getting-started/">
                                    Markdown syntax
                                    <sup>
                                        <ExternalLinkIcon />
                                    </sup>
                                </Link>{" "}
                                to format your text.
                            </FormHelperText>
                        </>
                    ) : (
                        <InputGroup>
                            {leftAddon ? <InputLeftAddon>{leftAddon}</InputLeftAddon> : undefined}
                            <Input
                                type={"text"}
                                value={v ?? ""}
                                onChange={(ev) => {
                                    let newV = ev.target.value;
                                    if (stripPrefixes) {
                                        for (const prefix of stripPrefixes) {
                                            if (newV.startsWith(prefix)) {
                                                newV = newV.substr(prefix.length);
                                                break;
                                            }
                                        }
                                    }
                                    setEditingAttendee({
                                        ...editingAttendee,
                                        profile: {
                                            ...editingAttendee.profile,
                                            [fieldName]: newV,
                                        },
                                    });
                                }}
                            />
                        </InputGroup>
                    )}
                </FormControl>
            );
        },
        [editingAttendee]
    );

    const bioField = useMemo(() => textField("bio", "Bio", "textarea"), [textField]);
    const affiliationField = useMemo(() => textField("affiliation", "Affiliation"), [textField]);
    const affiliationURLField = useMemo(
        () => textField("affiliationURL", "Affiliation URL", "url", "https://", ["https://", "http://"]),
        [textField]
    );
    const countryField = useMemo(() => textField("country", "Country"), [textField]);
    const webPageField = useMemo(() => textField("website", "Website", "url", "https://", ["https://", "http://"]), [
        textField,
    ]);
    const githubField = useMemo(
        () =>
            textField("github", "GitHub", "text", "github.com/", [
                "http://www.github.com/",
                "https://www.github.com/",
                "http://github.com/",
                "https://github.com/",
                "http://www.github.com",
                "https://www.github.com",
                "http://github.com",
                "https://github.com",
                "www.github.com/",
                "github.com/",
                "www.github.com",
                "github.com",
                "https://",
                "http://",
            ]),
        [textField]
    );
    const twitterField = useMemo(
        () =>
            textField("twitter", "Twitter", "text", "twitter.com/", [
                "http://www.twitter.com/",
                "https://www.twitter.com/",
                "http://twitter.com/",
                "https://twitter.com/",
                "http://www.twitter.com",
                "https://www.twitter.com",
                "http://twitter.com",
                "https://twitter.com",
                "www.twitter.com/",
                "twitter.com/",
                "www.twitter.com",
                "twitter.com",
                "https://",
                "http://",
            ]),
        [textField]
    );
    const timezoneField = useMemo(() => textField("timezoneUTCOffset", "Timezone Offset", "timezone", "UTC"), [
        textField,
    ]);

    const [isEditingName, setIsEditingName] = useState<boolean>(false);

    useEffect(() => {
        if (editingAttendee.displayName !== attendee.displayName && !isEditingName) {
            (async () => {
                await updateAttendeeDisplayName({
                    variables: {
                        attendeeId: attendee.id,
                        name: editingAttendee.displayName,
                    },
                });
                await attendee.refetch();
                toast({
                    title: "Name saved",
                    status: "success",
                    position: "top",
                    duration: 500,
                });
            })();
        }
    }, [attendee, editingAttendee.displayName, isEditingName, toast, updateAttendeeDisplayName]);

    const title = useTitle(
        currentUser.user.id === attendee.userId ? "Edit your profile" : `Edit ${attendee.displayName}`
    );

    return (
        <>
            {title}
            <VStack maxW={450} spacing={6} m={2}>
                <UnsavedChangesWarning hasUnsavedChanges={isDirty || displayNameIsDirty} />
                {attendee.userId === currentUser.user.id && !attendee.profile.hasBeenEdited ? (
                    <Alert status="warning" variant="top-accent" flexWrap="wrap">
                        <AlertIcon />
                        <AlertTitle>Edit required</AlertTitle>
                        <AlertDescription mt={2}>
                            Please edit at least one part of your profile before proceeding to the rest of the
                            conference.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <LinkButton to={`/conference/${conference.slug}`} colorScheme="green">
                        Continue to {conference.shortName}
                    </LinkButton>
                )}
                {isEditingName ? (
                    <VStack alignItems="flex-start" w="100%" maxW={350}>
                        <FormControl>
                            <FormLabel fontWeight="bold" fontSize="1.2rem">
                                Name
                            </FormLabel>
                            <Input
                                minLength={2}
                                value={editingAttendee.displayName}
                                onChange={(ev) => {
                                    setEditingAttendee({
                                        ...editingAttendee,
                                        displayName: ev.target.value,
                                    });
                                }}
                            />
                        </FormControl>
                        <Button colorScheme="green" onClick={() => setIsEditingName(false)}>
                            Save
                        </Button>
                    </VStack>
                ) : (
                    <Heading as="h1">
                        <Text as="span" mr={2}>
                            {editingAttendee.displayName}
                        </Text>
                        <IconButton
                            verticalAlign="top"
                            size="sm"
                            aria-label="Edit name"
                            icon={<EditIcon />}
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => setIsEditingName(true)}
                        />
                    </Heading>
                )}
                {errorUpdateAttendeeDisplayName || errorUpdateAttendeeProfile ? (
                    <Alert status="error">
                        <AlertIcon />
                        <AlertTitle mr={2}>Error saving changes</AlertTitle>
                        <AlertDescription>
                            {errorUpdateAttendeeProfile || errorUpdateAttendeeDisplayName}
                        </AlertDescription>
                    </Alert>
                ) : undefined}
                <EditProfilePitureForm attendee={attendee} />
                {bioField}
                <PronounInput
                    pronouns={editingAttendee.profile.pronouns ?? []}
                    onChange={(newPronouns) => {
                        setEditingAttendee({
                            ...editingAttendee,
                            profile: { ...editingAttendee.profile, pronouns: newPronouns },
                        });
                    }}
                />
                <BadgeInput
                    badges={editingAttendee.profile.badges ?? []}
                    onChange={(newBadges) => {
                        setEditingAttendee({
                            ...editingAttendee,
                            profile: { ...editingAttendee.profile, badges: newBadges },
                        });
                    }}
                />
                {timezoneField}
                {affiliationField}
                {affiliationURLField}
                {countryField}
                {webPageField}
                {twitterField}
                {githubField}
                {attendee.profile.hasBeenEdited ? (
                    <LinkButton to={`/conference/${conference.slug}`} colorScheme="green">
                        Continue to {conference.shortName}
                    </LinkButton>
                ) : undefined}
            </VStack>
        </>
    );
}

function EditCurrentProfilePage(): JSX.Element {
    const maybeCurrentAttendee = useMaybeCurrentAttendee();
    if (maybeCurrentAttendee) {
        return <EditProfilePageInner attendee={maybeCurrentAttendee} />;
    } else {
        return <PageNotFound />;
    }
}

function EditProfilePage_FetchWrapper({ attendeeId }: { attendeeId: string }): JSX.Element {
    const conference = useConference();
    const { loading, error, data, refetch } = useAttendeeByIdQuery({
        variables: {
            conferenceId: conference.id,
            attendeeId,
        },
    });

    if (loading && !data) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return <PageNotFound />;
    }

    return data && data.Attendee[0].profile ? (
        <EditProfilePageInner
            attendee={{
                ...data.Attendee[0],
                profile: data.Attendee[0].profile,
                refetch: async () => {
                    await refetch();
                },
            }}
        />
    ) : (
        <PageNotFound />
    );
}

export default function EditProfilePage({ attendeeId }: { attendeeId?: string }): JSX.Element {
    if (attendeeId) {
        return <EditProfilePage_FetchWrapper attendeeId={attendeeId} />;
    } else {
        return <EditCurrentProfilePage />;
    }
}
