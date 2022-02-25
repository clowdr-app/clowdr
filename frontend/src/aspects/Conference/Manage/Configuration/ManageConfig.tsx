import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    Divider,
    GridItem,
    Heading,
    InputLeftAddon,
    InputRightAddon,
    SimpleGrid,
    Text,
    Tooltip,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useCallback, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { gql } from "urql";
import { Conference_ConfigurationKey_Enum, useUpdateConferenceMutation } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import { roleOptions } from "../Content/v2/Submissions/SubmissionRequestsModal";
import { DashboardPage } from "../DashboardPage";
import DateTimeSetting from "./DateTimeSetting";
import EditConferenceLogoForm from "./EditConferenceLogoForm";
import MultiSelectSetting from "./MultiSelectSetting";
import MultiSettingUpdater from "./MultiSettingUpdater";
import RadioSetting from "./RadioSetting";
import SettingUpdater from "./SettingUpdater";
import TextAreaSetting from "./TextAreaSetting";
import TextSetting from "./TextSetting";

gql`
    mutation UpdateConference($id: uuid!, $name: String = "", $shortName: String = "", $slug: String = "") {
        update_conference_Conference(
            where: { id: { _eq: $id } }
            _set: { name: $name, shortName: $shortName, slug: $slug }
        ) {
            returning {
                id
                name
                shortName
                slug
            }
        }
    }
`;

export function normaliseSlug(value: string | null | undefined): string | undefined {
    return value?.replace(/\s/g, "");
}

export function validateSlug(inValue: string | null | undefined): string | undefined {
    let error;

    const value = inValue ? normaliseSlug(inValue) : undefined;
    if (!value || value.length === 0) {
        error = "URL slug is required";
    } else if (value.length < 5) {
        error = "URL slug must be at least 5 characters.";
    }

    return error;
}

export default function ManageConfig(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Settings of ${conference.shortName}`);
    const [_updateConferenceMutationResponse, updateConferenceMutation] = useUpdateConferenceMutation();

    const toast = useToast();
    const history = useHistory();
    const updateConference = useCallback(
        async (name: string, shortName: string, slug: string) => {
            try {
                const variables = {
                    id: conference.id,
                    name: name,
                    shortName: shortName,
                    slug: slug,
                };
                const result = await updateConferenceMutation(variables, {
                    fetchOptions: {
                        headers: {
                            [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                        },
                    },
                });
                if (result.error || !result.data) {
                    throw new Error(JSON.stringify(result.error));
                } else {
                    if (conference.slug !== variables.slug) {
                        toast({
                            title: "Changes saved. Redirecting to new url.",
                            status: "success",
                            duration: 2000,
                        });
                        window.localStorage.removeItem("SLUG_CACHE");
                        history.push(`/conference/${variables.slug}/manage/settings`);
                    } else {
                        toast({
                            title: "Changes saved",
                            description: "Please refresh the page to see the changes.",
                            status: "success",
                            duration: 4000,
                        });
                    }
                }
            } catch (e: any) {
                const msg = e.toString();
                let expectedError: false | string = false;
                if (msg.includes("Uniqueness violation")) {
                    if (msg.includes("Conference_name_key")) {
                        expectedError = "Name already taken.";
                    } else if (msg.includes("Conference_shortName_key")) {
                        expectedError = "Short name already taken.";
                    } else if (msg.includes("Conference_slug_key")) {
                        expectedError = "URL slug already taken.";
                    }
                }

                if (expectedError) {
                    toast({
                        title: "Failed to save changes",
                        description: expectedError,
                        status: "error",
                        duration: 7000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: "Failed to save changes",
                        description: `An error has occurred while trying to save your changes.
    Please contact our tech support to investigate the issue shown below.`,
                        status: "error",
                        duration: null,
                        isClosable: true,
                    });
                    toast({
                        title: "Error information",
                        description: msg,
                        status: "info",
                        duration: null,
                        isClosable: true,
                    });
                }
            }
        },
        [conference.id, conference.slug, history, toast, updateConferenceMutation]
    );
    const [disableUrlSlug, setDisableUrlSlug] = useState<boolean>(true);
    const [disableSaveUrlSlug, setDisableSaveUrlSlug] = useState<boolean>(false);
    const urlSlugWarningText =
        "Changing this setting will break any existing links to your conference (e.g. links sent to presenters via email or shared on social media).";
    const [newURLSlug, setNewURLSlug] = useState<string | null>(null);
    const resetURLSlug = useRef<() => void>(null);

    return (
        <DashboardPage title="Settings">
            {title}
            <VStack alignItems="flex-start" spacing={12}>
                <Section title="Basic" description="Basic information about your conference.">
                    <Setting title="Name" description="The full name of your conference. Minimum length 5.">
                        <TextSetting
                            type="text"
                            value={conference.name}
                            settingName="Name"
                            onChange={(value) => {
                                if (value?.length >= 5) {
                                    updateConference(value, conference.shortName, conference.slug);
                                }
                            }}
                            minLength={5}
                            maxLength={120}
                        />
                    </Setting>
                    <Setting
                        title="Short Name"
                        description="The short-form name of your conference (e.g. its acronym and year such as MAC 2022). Minimum length 5."
                    >
                        <TextSetting
                            type="text"
                            value={conference.shortName}
                            settingName="Short Name"
                            onChange={(value) => {
                                if (value?.length >= 5) {
                                    updateConference(conference.name, value, conference.slug);
                                }
                            }}
                            minLength={5}
                            maxLength={12}
                        />
                    </Setting>
                    <Setting title="URL Slug" description="The identifying part of the url for your conference.">
                        <TextSetting
                            type="text"
                            value={conference.slug}
                            settingName="URL Slug"
                            onChangeStarted={(value) => {
                                setDisableSaveUrlSlug(true);
                                const newSlug = normaliseSlug(value);
                                if (newSlug && validateSlug(newSlug) === undefined && newSlug !== conference.slug) {
                                    setNewURLSlug(newSlug);
                                } else {
                                    setNewURLSlug(null);
                                }
                            }}
                            onChange={(value) => {
                                setDisableSaveUrlSlug(false);
                                const newSlug = normaliseSlug(value);
                                if (newSlug && validateSlug(newSlug) === undefined && newSlug !== conference.slug) {
                                    setNewURLSlug(newSlug);
                                } else {
                                    setNewURLSlug(null);
                                }
                            }}
                            onReset={resetURLSlug}
                            isDisabled={disableUrlSlug}
                            leftAddon={
                                <InputLeftAddon>
                                    <FAIcon
                                        iconStyle="s"
                                        icon={newURLSlug ? "save" : disableUrlSlug ? "lock" : "unlock"}
                                    />
                                </InputLeftAddon>
                            }
                            rightAddon={
                                <InputRightAddon p={0} m={0}>
                                    <Tooltip label={disableUrlSlug ? urlSlugWarningText : ""}>
                                        <>
                                            <Button
                                                colorScheme={newURLSlug ? "ConfirmButton" : "yellow"}
                                                onClick={() => {
                                                    if (newURLSlug) {
                                                        setDisableUrlSlug(true);
                                                        updateConference(
                                                            conference.name,
                                                            conference.shortName,
                                                            newURLSlug
                                                        );
                                                        setNewURLSlug(null);
                                                    } else {
                                                        setDisableUrlSlug((old) => !old);
                                                    }
                                                }}
                                                isDisabled={Boolean(newURLSlug) && disableSaveUrlSlug}
                                            >
                                                {newURLSlug ? "Save" : disableUrlSlug ? "Unlock" : "Lock"}
                                            </Button>
                                            {newURLSlug ? (
                                                <Button
                                                    colorScheme="PrimaryActionButton"
                                                    onClick={() => {
                                                        setDisableUrlSlug(true);
                                                        setNewURLSlug(null);
                                                        resetURLSlug.current?.();
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            ) : undefined}
                                        </>
                                    </Tooltip>
                                </InputRightAddon>
                            }
                            minLength={5}
                            maxLength={12}
                        />
                        {!disableUrlSlug ? (
                            <Alert status="warning" alignItems="flex-start">
                                <AlertIcon />
                                <VStack alignItems="flex-start" spacing={0}>
                                    <AlertTitle>Proceed with caution</AlertTitle>
                                    <AlertDescription>{urlSlugWarningText}</AlertDescription>
                                </VStack>
                            </Alert>
                        ) : undefined}
                    </Setting>
                    <Setting
                        title="Custom domain"
                        description="Custom domain for your conference. Please contact support to change this."
                    >
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.FrontendHost}
                            defaultValue={""}
                        >
                            {({ value, settingName }) => (
                                <TextSetting
                                    type="url"
                                    value={value}
                                    settingName={settingName}
                                    onChange={() => {
                                        // Do nothing
                                    }}
                                    isDisabled={true}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Conference Logo"
                        description="Logo to appear in the header of all pages for your conference"
                    >
                        <EditConferenceLogoForm {...{conference}}/>
                    </Setting>
                </Section>
                <Section
                    title="Contact &amp; Registration"
                    description="Contact and registration details for your conference."
                >
                    <Setting title="Support Address" description="Contact email address for your organising team.">
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.SupportAddress}
                            defaultValue={""}
                        >
                            {(props) => <TextSetting type="email" {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Tech Support Address"
                        description="Contact email address for Midspace's technical support team."
                    >
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.TechSupportAddress}
                            defaultValue={""}
                        >
                            {({ value, settingName }) => (
                                <TextSetting
                                    type="email"
                                    value={value}
                                    settingName={settingName}
                                    onChange={() => {
                                        // Do nothing
                                    }}
                                    isDisabled={true}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting title="Registration URL" description="URL to your conference's public registration page.">
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.RegistrationUrl}
                            defaultValue={""}
                        >
                            {(props) => <TextSetting type="url" {...props} />}
                        </SettingUpdater>
                    </Setting>
                </Section>
                <Section title="Submissions" description="Submission controls.">
                    <Setting title="Submission Deadline" description="The time after which to prevent new submissions.">
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.UploadCutoffTimestamp}
                            defaultValue={undefined}
                        >
                            {(props) => <DateTimeSetting {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Submission Agreement"
                        description="URL to your conference's terms of submission, such as copyright assignment."
                    >
                        <SettingUpdater<{ agreementUrl: string }>
                            settingName={Conference_ConfigurationKey_Enum.UploadAgreement}
                            defaultValue={{ agreementUrl: "" }}
                        >
                            {({ value, settingName, onChange }) => (
                                <TextSetting
                                    settingName={settingName}
                                    value={value.agreementUrl}
                                    onChange={(newValue) => {
                                        onChange({
                                            agreementUrl: newValue,
                                        });
                                    }}
                                    type="url"
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Roles that should receive submission notifications (e.g. subtitles)"
                        description="Choose which program people roles which should receive (non-invitation) notification emails about their items (e.g. when subtitles are generated)."
                    >
                        <SettingUpdater<string[]>
                            settingName={Conference_ConfigurationKey_Enum.SubmissionNotificationRoles}
                            defaultValue={["PRESENTER", "AUTHOR"]}
                        >
                            {(props) => <MultiSelectSetting options={roleOptions ?? []} {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Send email notifications for event recording subtitles"
                        description="Enable or disable sending email notifications about subtitle corrections to program people when a recording is created for a related event."
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.EnableRecordingSubtitleEmailNotifications}
                            defaultValue={true}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                </Section>
                <Section title="Automatic Invitations" description="Automatically send invitations to registrants.">
                    <Setting
                        title="Stop automatic invites"
                        description="Immediately clear automatic invitations configuration to stop further automated invites."
                    >
                        <MultiSettingUpdater
                            settingNames={[
                                Conference_ConfigurationKey_Enum.AutomaticInvitationsStart,
                                Conference_ConfigurationKey_Enum.AutomaticInvitationsRepeatStart,
                            ]}
                        >
                            {(properties) => (
                                <Button
                                    colorScheme="DestructiveActionButton"
                                    isDisabled={properties.values.every((x) => !x.value)}
                                    onClick={() => {
                                        properties.deleteAll();
                                    }}
                                >
                                    Stop automatic invitations
                                </Button>
                            )}
                        </MultiSettingUpdater>
                    </Setting>
                    <Setting
                        title="Initial: Start time"
                        description="The time at which to start automatically sending initial invitations to registrants."
                    >
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.AutomaticInvitationsStart}
                            defaultValue={undefined}
                        >
                            {(props) => <DateTimeSetting {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Initial: End time"
                        description="The time at which to stop automatically sending initial invitations to registrants."
                    >
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.AutomaticInvitationsEnd}
                            defaultValue={undefined}
                        >
                            {(props) => <DateTimeSetting {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Reminders: Start time"
                        description="The time at which to start automatically sending repeat invitations to registrants who have not already accepted."
                    >
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.AutomaticInvitationsRepeatStart}
                            defaultValue={undefined}
                        >
                            {(props) => <DateTimeSetting {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Reminders: End time"
                        description="The time at which to stop automatically sending repeat invitations to registrants who have not already accepted."
                    >
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.AutomaticInvitationsRepeatEnd}
                            defaultValue={undefined}
                        >
                            {(props) => <DateTimeSetting {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Reminders: Frequency"
                        description="The frequency with which to send repeat invitations."
                    >
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.AutomaticInvitationsRepeatFrequency}
                            defaultValue={2 * 24 * 60 * 60 * 1000}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : parseInt(newValue, 10))
                                    }
                                    value={value.toString()}
                                    options={[
                                        { label: "1 day", value: (24 * 60 * 60 * 1000).toString() },
                                        { label: "2 days", value: (2 * 24 * 60 * 60 * 1000).toString() },
                                        { label: "3 days", value: (3 * 24 * 60 * 60 * 1000).toString() },
                                        { label: "4 days", value: (4 * 24 * 60 * 60 * 1000).toString() },
                                        { label: "5 days", value: (5 * 24 * 60 * 60 * 1000).toString() },
                                        { label: "6 days", value: (6 * 24 * 60 * 60 * 1000).toString() },
                                        { label: "7 days", value: (7 * 24 * 60 * 60 * 1000).toString() },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                </Section>
                <Section
                    title="Interface"
                    description="Adjust labels and enable/disable certain parts of the Midspace interface."
                >
                    <Setting title="Sponsors label" description="Rename sponsors, e.g. to 'Publishers'">
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.SponsorsLabel}
                            defaultValue={""}
                        >
                            {(props) => <TextSetting type="text" {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Sponsors link in left menu bar"
                        description="Show a link for Sponsors in the left menu bar"
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.ForceMenuSponsorsLink}
                            defaultValue={false}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Hide nearby events"
                        description="Hide the 'Nearby events' section of the content pages."
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.DisableNearbyEvents}
                            defaultValue={false}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Hide all times for this content"
                        description="Hide the 'All times for this content' section of the content pages."
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.DisableAllEventsForItem}
                            defaultValue={false}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting title="Visible exhibitions label" description="Relabel visible exhibitions">
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.VisibleExhibitionsLabel}
                            defaultValue={""}
                        >
                            {(props) => <TextSetting type="text" {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Hidden exhibitions label"
                        description="Relabel hidden exhibitions, e.g. to 'session'"
                    >
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.HiddenExhibitionsLabel}
                            defaultValue={""}
                        >
                            {(props) => <TextSetting type="text" {...props} />}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Hide exhibition people from schedule"
                        description="Hide the list of people (drawn from content within exhibitions) from the event boxes in the schedule view."
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.EventBoxHideExhibitionPeople}
                            defaultValue={false}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                </Section>
                <Section
                    title="Live-streams and video chats"
                    description="Pre-recorded, Presentation and Q&amp;A -mode events, backstages and video-chats."
                >
                    <Setting
                        title="Filler video"
                        description="This video will play on a loop in live-streams in between pre-recorded videos and live events. It can also be played manually from the backstage to fill time."
                    >
                        <Text mt="3.5ex">
                            Please upload your filler video to your Landing Page content as a &ldquo;hidden&rdquo; Video
                            File element. Then contact our tech support to ask them to update this setting.
                        </Text>
                    </Setting>
                    <Setting
                        title="Backstage Stream Preview"
                        description="Enable or disable the backstage preview stream."
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.EnableBackstageStreamPreview}
                            defaultValue={false}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="External RTMP Broadcast"
                        description="Enable or disable broadcasting of streams from a room to an external RTMP destination such as YouTube."
                    >
                        <SettingUpdater<boolean>
                            settingName={Conference_ConfigurationKey_Enum.EnableExternalRtmpBroadcast}
                            defaultValue={false}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : newValue === "true")
                                    }
                                    value={value ? "true" : "false"}
                                    options={[
                                        { label: "Enabled", value: "true" },
                                        { label: "Disabled", value: "false" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="Maximum Simultaneous Screenshares"
                        description="Maximum number of simultaneous screenshares (from different participants) in a video-chat or backstage."
                    >
                        <SettingUpdater<number>
                            settingName={Conference_ConfigurationKey_Enum.VonageMaxSimultaneousScreenShares}
                            defaultValue={0}
                        >
                            {({ value, onChange, settingName }) => (
                                <RadioSetting
                                    settingName={settingName}
                                    onChange={(newValue) =>
                                        onChange(newValue === undefined ? undefined : parseInt(newValue, 10))
                                    }
                                    value={value.toString()}
                                    options={[
                                        { label: "0", value: "0" },
                                        { label: "1", value: "1" },
                                        { label: "2", value: "2" },
                                    ]}
                                />
                            )}
                        </SettingUpdater>
                    </Setting>
                    <Setting
                        title="My Backstages Notice"
                        description="A message placed at the top of the My Backstages modal."
                    >
                        <SettingUpdater<string>
                            settingName={Conference_ConfigurationKey_Enum.MyBackstagesNotice}
                            defaultValue={""}
                        >
                            {(props) => <TextAreaSetting {...props} />}
                        </SettingUpdater>
                    </Setting>
                </Section>
            </VStack>
        </DashboardPage>
    );
}

function Section({
    title,
    description,
    children,
}: React.PropsWithChildren<{ title: string; description: string }>): JSX.Element {
    return (
        <>
            <VStack spacing={8} alignItems="flex-start" w="100%">
                <VStack spacing={4} alignItems="flex-start" w="100%">
                    <Heading as="h2" fontSize="2xl">
                        {title}
                    </Heading>
                    <Text>{description}</Text>
                </VStack>
                <SimpleGrid pl={8} pr={2} columns={[1, 1, 2]} gridRowGap={[4, 4, 8]} gridColumnGap={4} w="100%">
                    {children}
                </SimpleGrid>
            </VStack>
            <Divider />
        </>
    );
}

function Setting({
    title,
    description,
    children,
}: React.PropsWithChildren<{ title: string; description: string }>): JSX.Element {
    return (
        <>
            <GridItem paddingTop={[4, 4, 0]}>
                <VStack spacing={2} alignItems="flex-start">
                    <Heading as="h3" fontSize="lg" textAlign="left">
                        {title}
                    </Heading>
                    <Text>{description}</Text>
                </VStack>
            </GridItem>
            <GridItem>{children}</GridItem>
        </>
    );
}
