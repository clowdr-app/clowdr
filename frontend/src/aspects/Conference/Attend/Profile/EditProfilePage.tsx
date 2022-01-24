import { gql } from "@apollo/client";
import { EditIcon, ExternalLinkIcon } from "@chakra-ui/icons";
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
    useRegistrantByIdQuery,
    useRegistrantInvitedEmailAddressQuery,
    useUpdateProfileMutation,
    useUpdateRegistrantDisplayNameMutation,
} from "../../../../generated/graphql";
import BadgeInput from "../../../Badges/BadgeInput";
import type { BadgeData } from "../../../Badges/ProfileBadge";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import UnsavedChangesWarning from "../../../LeavingPageWarnings/UnsavedChangesWarning";
import PronounInput from "../../../Pronouns/PronounInput";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import type { Profile, RegistrantContextT } from "../../useCurrentRegistrant";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import EditProfilePitureForm from "./EditProfilePictureForm";
import { FormattedMessage, useIntl } from "react-intl";

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

function deepProfileIsEqual(x: RegistrantContextT, y: RegistrantContextT): boolean {
    return (
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
    query RegistrantById($conferenceId: uuid!, $registrantId: uuid!) {
        registrant_Registrant(where: { id: { _eq: $registrantId }, conferenceId: { _eq: $conferenceId } }) {
            ...RegistrantData
        }
    }

    query RegistrantInvitedEmailAddress($registrantId: uuid!) {
        registrant_Invitation(where: { registrantId: { _eq: $registrantId } }) {
            id
            invitedEmailAddress
        }
    }

    mutation UpdateProfile($registrantId: uuid!, $profile: registrant_Profile_set_input = {}) {
        update_registrant_Profile_by_pk(pk_columns: { registrantId: $registrantId }, _set: $profile) {
            ...ProfileData
        }
    }

    mutation UpdateRegistrantDisplayName($registrantId: uuid!, $name: String!) {
        update_registrant_Registrant_by_pk(pk_columns: { id: $registrantId }, _set: { displayName: $name }) {
            ...RegistrantData
        }
    }
`;

function EditProfilePageInner({ registrant }: { registrant: RegistrantContextT }): JSX.Element {
    const intl = useIntl();
    const conference = useConference();
    const currentUser = useCurrentUser();

    const [editingRegistrant, setEditingRegistrant] = useState<RegistrantContextT>(registrant);

    const isDirty = useMemo(() => !deepProfileIsEqual(registrant, editingRegistrant), [registrant, editingRegistrant]);
    const displayNameIsDirty = editingRegistrant.displayName !== registrant.displayName;

    const [updateProfile, { loading: loadingUpdateAttendeProfile, error: errorUpdateProfile }] =
        useUpdateProfileMutation();
    const [
        updateRegistrantDisplayName,
        { loading: loadingUpdateAttendeDisplayName, error: errorUpdateRegistrantDisplayName },
    ] = useUpdateRegistrantDisplayNameMutation();

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
                        <Text as="span">
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.SavingChanges"
                                defaultMessage="Saving changes…"
                            />
                        </Text>
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
                        await updateProfile({
                            variables: {
                                registrantId: registrant.id,
                                profile: {
                                    affiliation: editingRegistrant.profile.affiliation,
                                    affiliationURL: editingRegistrant.profile.affiliationURL,
                                    country: editingRegistrant.profile.country,
                                    timezoneUTCOffset: editingRegistrant.profile.timezoneUTCOffset,
                                    bio: editingRegistrant.profile.bio,
                                    website: editingRegistrant.profile.website,
                                    github: editingRegistrant.profile.github,
                                    twitter: editingRegistrant.profile.twitter,
                                    badges: editingRegistrant.profile.badges,
                                    pronouns: editingRegistrant.profile.pronouns,
                                    hasBeenEdited: true,
                                },
                            },
                        });
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
        registrant,
        editingRegistrant.displayName,
        editingRegistrant.profile,
        isDirty,
        updateRegistrantDisplayName,
        updateProfile,
    ]);

    const textField = useCallback(
        (
            fieldName: keyof {
                [K in keyof Profile]: Profile[K] extends string | number ? Profile[K] : never;
            },
            title: string,
            type?: string,
            leftAddon?: string,
            stripPrefixes?: string[],
            helperText?: string
        ) => {
            const v = editingRegistrant.profile[fieldName] as string | number | undefined;
            return (
                <FormControl>
                    <FormLabel fontWeight="bold" fontSize="1.2rem">
                        {title}
                    </FormLabel>
                    {type === "number" || type === "timezone" ? (
                        <InputGroup>
                            {leftAddon ? <InputLeftAddon>{leftAddon}</InputLeftAddon> : undefined}
                            <NumberInput
                                min={type === "timezone" ? -24 : undefined}
                                max={type === "timezone" ? +24 : undefined}
                                precision={1}
                                allowMouseWheel
                                value={(v as number | undefined)?.toFixed(1) ?? ""}
                                step={0.5}
                                onChange={(vvv, v) => {
                                    if (vvv !== "") {
                                        setEditingRegistrant({
                                            ...editingRegistrant,
                                            profile: {
                                                ...editingRegistrant.profile,
                                                [fieldName]: type === "timezone" ? Math.round(v * 2) / 2 : v,
                                            },
                                        });
                                    }
                                }}
                                pattern="-?[0-9]*(.[0-9]+)?"
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper aria-label={intl.formatMessage({ id: 'Conference.Attend.Profile.EditProfilePage.Increment', defaultMessage: "Increment" })} />
                                    <NumberDecrementStepper aria-label={intl.formatMessage({ id: 'Conference.Attend.Profile.EditProfilePage.Decrement', defaultMessage: "Decrement" })} />
                                </NumberInputStepper>
                            </NumberInput>
                        </InputGroup>
                    ) : type === "textarea" ? (
                        <>
                            <Textarea
                                transition="none"
                                value={v ?? ""}
                                onChange={(ev) => {
                                    setEditingRegistrant({
                                        ...editingRegistrant,
                                        profile: {
                                            ...editingRegistrant.profile,
                                            [fieldName]: ev.target.value,
                                        },
                                    });
                                }}
                            />
                            <FormHelperText>
                                <Link isExternal href="https://www.markdownguide.org/getting-started/">
                                    <FormattedMessage
                                        id="Conference.Attend.Profile.EditProfilePage.MarkdownSyntax"
                                        defaultMessage="Use Markdown syntax to format your text."
                                    />
                                    <sup>
                                        <ExternalLinkIcon />
                                    </sup>
                                </Link>
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
                                            if (newV.toLowerCase().startsWith(prefix)) {
                                                newV = newV.substr(prefix.length);
                                                break;
                                            }
                                        }
                                    }
                                    setEditingRegistrant({
                                        ...editingRegistrant,
                                        profile: {
                                            ...editingRegistrant.profile,
                                            [fieldName]: newV.trimStart(),
                                        },
                                    });
                                }}
                            />
                        </InputGroup>
                    )}
                    {helperText && <FormHelperText>{helperText}</FormHelperText>}
                </FormControl>
            );
        },
        [editingRegistrant]
    );

    const bioField = useMemo(() => textField("bio", "Bio", "textarea"), [textField]);
    const affiliationField = useMemo(() => textField("affiliation", "Affiliation"), [textField]);
    const affiliationURLField = useMemo(
        () => textField("affiliationURL", "Affiliation URL", "url", "URL"),
        [textField]
    );
    const countryField = useMemo(() => textField("country", "Country"), [textField]);
    const webPageField = useMemo(() => textField("website", "Website", "url", "URL"), [textField]);
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
    const timezoneField = useMemo(
        () =>
            textField(
                "timezoneUTCOffset",
                "Timezone Offset",
                "timezone",
                "UTC",
                undefined,
                intl.formatMessage({
                    id: 'Conference.Attend.Profile.EditProfilePage.DoesNotChangeScheduleDisplay',
                    defaultMessage: "This does not change how the schedule is shown to you in Midspace. The schedule always displays in your local timezone according to your computer's settings."
                })
            ),
        [textField]
    );

    const [isEditingName, setIsEditingName] = useState<boolean>(false);

    useEffect(() => {
        if (editingRegistrant.displayName !== registrant.displayName && !isEditingName) {
            (async () => {
                await updateRegistrantDisplayName({
                    variables: {
                        registrantId: registrant.id,
                        name: editingRegistrant.displayName,
                    },
                });
                toast({
                    title: intl.formatMessage({ id: 'Conference.Attend.Profile.EditProfilePage.NameSaved', defaultMessage: "Name saved" }),
                    status: "success",
                    position: "top",
                    duration: 500,
                });
            })();
        }
    }, [registrant, editingRegistrant.displayName, isEditingName, toast, updateRegistrantDisplayName]);

    const title = useTitle(
        currentUser.user.id === registrant.userId
            ? intl.formatMessage({ id: 'Conference.Attend.Profile.EditProfilePage.EditYourProfile', defaultMessage: "Edit your profile" })
            : intl.formatMessage({ id: 'Conference.Attend.Profile.EditProfilePage.EditRegistrant', defaultMessage: "Edit {name}" }, { name: registrant.displayName })
    );

    const invitation = useRegistrantInvitedEmailAddressQuery({
        variables: {
            registrantId: registrant.id,
        },
    });

    return (
        <>
            {title}
            <VStack maxW={450} spacing={6} m={2}>
                <UnsavedChangesWarning hasUnsavedChanges={isDirty || displayNameIsDirty} />
                {registrant.userId === currentUser.user.id &&
                !registrant.profile.hasBeenEdited &&
                !registrant.profile.photoURL_350x350 ? (
                    <Alert status="warning" variant="top-accent" flexWrap="wrap">
                        <AlertIcon />
                        <AlertTitle>
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.PleaseEdit"
                                defaultMessage="Please make an edit"
                            />
                        </AlertTitle>
                        <AlertDescription mt={2}>
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.PleaseEditDesc"
                                defaultMessage="Please edit at least one part of your profile before proceeding. For example, you might like
                                to upload a profile picture or add a badge."
                            />
                        </AlertDescription>
                    </Alert>
                ) : (
                    <ButtonGroup variant="outline">
                        <LinkButton to={`/conference/${conference.slug}`} colorScheme="PrimaryActionButton">
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.ContinueToConference"
                                defaultMessage="Continue to {conference}"
                                values={{ conference: conference.shortName }}
                            />
                        </LinkButton>
                        <LinkButton
                            to={
                                registrant.userId === currentUser.user.id
                                    ? `/conference/${conference.slug}/profile/view`
                                    : `/conference/${conference.slug}/profile/view/${registrant.id}`
                            }
                            colorScheme="PrimaryActionButton"
                        >
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.ViewProfile"
                                defaultMessage="View profile"
                            />
                        </LinkButton>
                    </ButtonGroup>
                )}
                {isEditingName ? (
                    <VStack alignItems="flex-start" w="100%" maxW={350}>
                        <FormControl>
                            <FormLabel fontWeight="bold" fontSize="1.2rem">
                                <FormattedMessage
                                    id="Conference.Attend.Profile.EditProfilePage.Name"
                                    defaultMessage="Name"
                                />
                            </FormLabel>
                            <Input
                                minLength={2}
                                value={editingRegistrant.displayName}
                                onChange={(ev) => {
                                    setEditingRegistrant({
                                        ...editingRegistrant,
                                        displayName: ev.target.value,
                                    });
                                }}
                            />
                        </FormControl>
                        <Button colorScheme="ConfirmButton" onClick={() => setIsEditingName(false)}>
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.Save"
                                defaultMessage="Save"
                            />
                        </Button>
                    </VStack>
                ) : (
                    <Heading as="h1" id="page-heading">
                        <Text as="span" mr={2}>
                            {editingRegistrant.displayName}
                        </Text>
                        <IconButton
                            verticalAlign="top"
                            size="sm"
                            aria-label={intl.formatMessage({ id: 'Conference.Attend.Profile.EditProfilePage.EditName', defaultMessage: "Edit name" })}
                            icon={<EditIcon />}
                            variant="outline"
                            colorScheme="PrimaryActionButton"
                            onClick={() => setIsEditingName(true)}
                        />
                    </Heading>
                )}
                {errorUpdateRegistrantDisplayName || errorUpdateProfile ? (
                    <Alert status="error">
                        <AlertIcon />
                        <AlertTitle mr={2}>
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.ErrorSavingChanges"
                                defaultMessage="Error saving changes"
                            />
                        </AlertTitle>
                        <AlertDescription>{errorUpdateProfile || errorUpdateRegistrantDisplayName}</AlertDescription>
                    </Alert>
                ) : undefined}
                <EditProfilePitureForm registrant={registrant} />
                <FormControl>
                    <FormLabel fontWeight="bold" fontSize="1.2rem">
                        <FormattedMessage
                            id="Conference.Attend.Profile.EditProfilePage.AccountLoginEmailAddress"
                            defaultMessage="Account login email address"
                        />
                    </FormLabel>
                    <Input type="text" value={currentUser.user.email ?? ""} isDisabled />
                    <FormHelperText>
                        <FormattedMessage
                            id="Conference.Attend.Profile.EditProfilePage.AccountLoginEmailAddressHelper"
                            defaultMessage="The email address you use to log in to your account."
                        />
                    </FormHelperText>
                </FormControl>
                {invitation.data?.registrant_Invitation.length ? (
                    <FormControl>
                        <FormLabel fontWeight="bold" fontSize="1.2rem">
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.InvitationEmailAddress"
                                defaultMessage="Invitation email address"
                            />
                        </FormLabel>
                        <Input
                            type="text"
                            value={invitation.data.registrant_Invitation[0].invitedEmailAddress}
                            isDisabled
                        />
                        <FormHelperText>
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.InvitationEmailAddressHelper"
                                defaultMessage="Your invitation for this conference was originally sent to this address. It is okay if this
                                is different from your login address."
                            />
                        </FormHelperText>
                    </FormControl>
                ) : undefined}
                {bioField}
                <BadgeInput
                    badges={editingRegistrant.profile.badges ?? []}
                    onChange={(newBadges) => {
                        setEditingRegistrant({
                            ...editingRegistrant,
                            profile: { ...editingRegistrant.profile, badges: newBadges },
                        });
                    }}
                />
                {affiliationField}
                {affiliationURLField}
                {timezoneField}
                <PronounInput
                    pronouns={editingRegistrant.profile.pronouns ?? []}
                    onChange={(newPronouns) => {
                        setEditingRegistrant({
                            ...editingRegistrant,
                            profile: { ...editingRegistrant.profile, pronouns: newPronouns },
                        });
                    }}
                />
                {countryField}
                {webPageField}
                {twitterField}
                {githubField}
                {registrant.profile.hasBeenEdited ? (
                    <ButtonGroup variant="solid">
                        <LinkButton to={`/conference/${conference.slug}`} colorScheme="EditProfilePage-ContinueButton">
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.ContinueToConference"
                                defaultMessage="Continue to {conference}"
                                values={{ conference: conference.shortName }}
                            />
                        </LinkButton>
                        <LinkButton
                            to={
                                registrant.userId === currentUser.user.id
                                    ? `/conference/${conference.slug}/profile/view`
                                    : `/conference/${conference.slug}/profile/view/${registrant.id}`
                            }
                            colorScheme="SecondaryActionButton"
                        >
                            <FormattedMessage
                                id="Conference.Attend.Profile.EditProfilePage.ViewProfile"
                                defaultMessage="View profile"
                            />
                        </LinkButton>
                    </ButtonGroup>
                ) : undefined}
            </VStack>
        </>
    );
}

function EditCurrentProfilePage(): JSX.Element {
    const maybeCurrentRegistrant = useMaybeCurrentRegistrant();
    if (maybeCurrentRegistrant) {
        return <EditProfilePageInner registrant={maybeCurrentRegistrant} />;
    } else {
        return <PageNotFound />;
    }
}

function EditProfilePage_FetchWrapper({ registrantId }: { registrantId: string }): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useRegistrantByIdQuery({
        variables: {
            conferenceId: conference.id,
            registrantId,
        },
    });

    if (loading && !data) {
        return (
            <div>
                <Spinner />
            </div>
        );
    }

    if (error) {
        return <PageNotFound />;
    }

    return data && data.registrant_Registrant[0].profile ? (
        <EditProfilePageInner
            registrant={{
                ...data.registrant_Registrant[0],
                profile: data.registrant_Registrant[0].profile,
            }}
        />
    ) : (
        <PageNotFound />
    );
}

export default function EditProfilePage({ registrantId }: { registrantId?: string }): JSX.Element {
    if (registrantId) {
        return <EditProfilePage_FetchWrapper registrantId={registrantId} />;
    } else {
        return <EditCurrentProfilePage />;
    }
}
