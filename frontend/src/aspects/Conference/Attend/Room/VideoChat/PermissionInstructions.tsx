import { Heading, Image, Link, List, ListItem, Text } from "@chakra-ui/react";
import { detect } from "detect-browser";
import React, { useMemo } from "react";
import chromeImage from "./images/chrome-permissions.png";
import chromeScreenShareImage from "./images/chrome-screenshare.png";
import firefoxImage from "./images/firefox-permissions.png";
import safariImage from "./images/safari-permissions.png";
import type { DevicesProps } from "./PermissionInstructionsContext";
import { FormattedMessage, useIntl } from "react-intl";

export function devicesToFriendlyName(devices: DevicesProps, connective = "or"): string {
    const selectedDevices = Object.entries(devices)
        .filter((x) => x[1])
        .map((x) => x[0]);

    switch (selectedDevices.length) {
        case 0:
            return "device";
        case 1:
            return selectedDevices[0];
        default: {
            const head = selectedDevices.slice(0, -1).join(", ");
            const tail = `${connective} ${selectedDevices[selectedDevices.length - 1]}`;
            return `${head} ${tail}`;
        }
    }
}

export function PermissionInstructions({ ...props }: DevicesProps): JSX.Element {
    const detected = useMemo(() => detect(), []);

    const browserInstructionsEl = useMemo(() => {
        switch (detected?.name) {
            case "chrome":
                return <PermissionInstructionsChrome {...props} />;
            case "firefox":
                return <PermissionInstructionsFirefox {...props} />;
            case "safari":
                return <PermissionInstructionsSafari {...props} />;
            default:
                return <PermissionInstructionsOther {...props} />;
        }
    }, [detected?.name, props]);

    const osInstructionsEl = useMemo(() => {
        switch (detected?.os) {
            case "Mac OS":
                return <PermissionInstructionsMacOs {...props} />;
            default:
                return undefined;
        }
    }, [detected?.os, props]);

    return (
        <>
            {browserInstructionsEl}
            {osInstructionsEl}
            <PermissionInstructionsOtherApplications />
        </>
    );
}

const imageProps = { mx: "5%", my: 4, w: "auto", maxW: "90%", boxShadow: "lg", rounded: "xl" };

export function PermissionInstructionsChrome(devices: DevicesProps): JSX.Element {
    const intl = useIntl();
    return (
        <>
            {devices.camera || devices.microphone ? (
                <>
                    <Text>
                        <FormattedMessage
                            id="Conference.Attend.Room.VideoChat.PermissionInstructions.ChromeBlockingDevice"
                            defaultMessage="It seems that your web browser is not allowing Midspace to access the {device}.
                            Update your settings by clicking the icon in the address bar and setting the Camera and Microphone permissions to Allow."
                            values={{
                                device: devicesToFriendlyName(devices, ',')
                            }}
                        />
                    </Text>
                    <Image
                        {...imageProps}
                        src={chromeImage}
                        maxH="50vh"
                        alt={intl.formatMessage({
                            id: 'Conference.Attend.Room.VideoChat.PermissionInstructions.ChromePermissionsImg',
                            defaultMessage: "Use the permissions controls in the left end of the Chrome address bar to manage camera and microphone permissions."
                        })}
                    />
                    <Text>
                        <Link isExternal href="https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DDesktop">
                            <FormattedMessage
                                id="Conference.Attend.Room.VideoChat.PermissionInstructions.ChromeOfficialInstructions"
                                defaultMessage="If you need more help, see the official Google Chrome instructions."
                            />
                        </Link>
                    </Text>
                </>
            ) : undefined}
            {devices.screen ? (
                <>
                    <Text>
                        <FormattedMessage
                            id="Conference.Attend.Room.VideoChat.PermissionInstructions.ChromeConfirmClickCancel"
                            defaultMessage="The screen could not be shared. Did you click Cancel?"
                        />
                    </Text>
                    <Text>
                        <FormattedMessage
                            id="Conference.Attend.Room.VideoChat.PermissionInstructions.ChromeConfirmClickShare"
                            defaultMessage="To share, choose a screen, window or tab and click the Share button."
                        />
                    </Text>
                    <Image
                        {...imageProps}
                        src={chromeScreenShareImage}
                        maxH="50vh"
                        alt={intl.formatMessage({
                            id: 'Conference.Attend.Room.VideoChat.PermissionInstructions.ChromeShareImg',
                            defaultMessage: "The Chrome 'Choose what to share' dialog, showing the list of tabs that can be shared." })}
                    />
                </>
            ) : undefined}
        </>
    );
}

export function PermissionInstructionsFirefox(devices: DevicesProps): JSX.Element {
    const intl = useIntl();
    return (
        <>
            <Text>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.FirefoxBlockingDevice"
                    defaultMessage="It seems that your web browser is not allowing Midspace to access the {device}.
                    Remove any blocked devices by clicking the icon in the address bar and then the appropriate x button."
                    values={{
                        device: devicesToFriendlyName(devices)
                    }}
                />
            </Text>
            <Image
                {...imageProps}
                src={firefoxImage}
                alt={intl.formatMessage({
                    id: 'Conference.Attend.Room.VideoChat.PermissionInstructions.FirefoxPermissionsImg',
                    defaultMessage: "Use the permissions controls in the left end of the Firefox address bar to manage {device} permissions."},
                    { device: devicesToFriendlyName(devices, ',') }
                )}
            />
            <Text>
                <Link isExternal href="https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions">
                    <FormattedMessage
                        id="Conference.Attend.Room.VideoChat.PermissionInstructions.FirefoxOfficialInstructions"
                        defaultMessage="If you need more help, see the official Mozilla Firefox instructions."
                    />
                </Link>
            </Text>
        </>
    );
}

export function PermissionInstructionsSafari(devices: DevicesProps): JSX.Element {
    const intl = useIntl();
    return (
        <>
            <Text>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.SafariInstructions"
                    defaultMessage='It seems that your web browser is not allowing Midspace to access the {device}.
                    You may need to tell Safari to allow this. Open "Safari > Preferences..." and go to the "Website" tab. Choose to "Allow" access to the {device} on "{url}"'
                    values={{
                        device: devicesToFriendlyName(devices, ','),
                        url: window.location.host ?? "Midspace"
                    }}
                />
            </Text>
            <Image
                {...imageProps}
                src={safariImage}
                alt={intl.formatMessage({
                    id: "Conference.Attend.Room.VideoChat.PermissionInstructions.SafariWebsitesTab",
                    defaultMessage: "Use the Websites tab in Safari's preferences to manage {device} permissions." },{
                    device: devicesToFriendlyName(devices, ',')
                })}
            />
        </>
    );
}

export function PermissionInstructionsOther(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.BrowserBlockingDevice"
                    defaultMessage='It seems that your web browser is not allowing Midspace to access the {device}.
                    Please check your browser settings and try again.'
                    values={{
                        device: devicesToFriendlyName(devices, ',')
                    }}
                />
            </Text>
        </>
    );
}

function PermissionInstructionsMacOs(devices: DevicesProps): JSX.Element {
    const intl = useIntl();
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.UsingMacOs"
                    defaultMessage='Using macOS?'
                />
            </Heading>
            <Text>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.MacOSWontAllow"
                    defaultMessage='macOS will not allow your browser to access the {device} unless you have given permission to do so.'
                    values={{
                        device: devicesToFriendlyName(devices, ',')
                    }}
                />{" "}
                {devices.screen
                    ? intl.formatMessage({
                        id: "Conference.Attend.Room.VideoChat.PermissionInstructions.PermissionsMacOsCatalina",
                        defaultMessage: "Permissions controls for screen recording were introduced in macOS Catalina (10.15)." }) + " "
                    : ""}
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.MightFindHelpful"
                    defaultMessage='You may find the following helpful:'
                />
            </Text>
            <List>
                <ListItem>
                    {devices.camera ? (
                        <Link isExternal href="https://support.apple.com/en-gb/guide/mac-help/mchlf6d108da/mac">
                            <FormattedMessage
                                id="Conference.Attend.Room.VideoChat.PermissionInstructions.MacOsCameraAccess"
                                defaultMessage='Control access to the camera on your Mac'
                            />
                        </Link>
                    ) : undefined}
                </ListItem>
                <ListItem>
                    {devices.microphone ? (
                        <Link isExternal href="https://support.apple.com/en-gb/guide/mac-help/mchla1b1e1fe/mac">
                            <FormattedMessage
                                id="Conference.Attend.Room.VideoChat.PermissionInstructions.MacOsMicrophoneAccess"
                                defaultMessage='Control access to the microphone on your Mac'
                            />
                        </Link>
                    ) : undefined}
                </ListItem>
                <ListItem>
                    {devices.screen ? (
                        <Link isExternal href="https://support.apple.com/en-gb/guide/mac-help/mchld6aa7d23/mac">
                            <FormattedMessage
                                id="Conference.Attend.Room.VideoChat.PermissionInstructions.MacOsScreenAccess"
                                defaultMessage='Control access to screen recording on your Mac'
                            />
                        </Link>
                    ) : undefined}
                </ListItem>
            </List>
        </>
    );
}

function PermissionInstructionsOtherApplications(): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.CheckOtherApplications"
                    defaultMessage='Check other applications'
                />
            </Heading>
            <Text>
                <FormattedMessage
                    id="Conference.Attend.Room.VideoChat.PermissionInstructions.CheckOtherApplicationsDesc"
                    defaultMessage='Make sure you have fully exited other video applications like Zoom, Skype or Google Meet. These may
                    prevent Midspace from accessing your camera or microphone.'
                />
            </Text>
        </>
    );
}
