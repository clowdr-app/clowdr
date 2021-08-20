import { Heading, Image, Link, List, ListItem, Text } from "@chakra-ui/react";
import { detect } from "detect-browser";
import React, { useMemo } from "react";
import chromeImage from "./images/chrome-permissions.png";
import firefoxImage from "./images/firefox-permissions.png";
import safariImage from "./images/safari-permissions.png";

export type DevicesProps = {
    camera?: boolean;
    microphone?: boolean;
    screen?: boolean;
};

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
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Clowdr to access the {devicesToFriendlyName(devices)}.
                Update your settings by clicking the icon in the address bar and setting the Camera and Microphone
                permissions to Allow.
            </Text>
            <Image
                {...imageProps}
                src={chromeImage}
                maxH="50vh"
                alt="Use the permissions controls in the left end of the Chrome address bar to manage camera and microphone permissions."
            />
            <Text>
                If you need more help, see the{" "}
                <Link isExternal href="https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DDesktop">
                    official Google Chrome instructions
                </Link>
                .
            </Text>
        </>
    );
}

export function PermissionInstructionsFirefox(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Clowdr to access the {devicesToFriendlyName(devices)}.
                Remove any blocked devices by clicking the icon in the address bar and then the appropriate x button.
            </Text>
            <Image
                {...imageProps}
                src={firefoxImage}
                alt={`Use the permissions controls in the left end of the Firefox address bar to manage ${devicesToFriendlyName(
                    devices,
                    "and"
                )} permissions.`}
            />
            <Text>
                If you need more help, see the{" "}
                <Link
                    isExternal
                    href="https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions"
                >
                    official Mozilla Firefox instructions
                </Link>
                .
            </Text>
        </>
    );
}

export function PemissionInstructionsSafari(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Clowdr to access the {devicesToFriendlyName(devices)}.
                You may need to tell Safari to allow this. Open <em>Safari &rarr; Preferences...</em> and go to the{" "}
                <em>Website</em> tab. Choose &lsquo;Allow&rsquo; for {window.location.host ?? "Clowdr"} for{" "}
                {devicesToFriendlyName(devices, "and")}.
            </Text>
            <Image
                {...imageProps}
                src={safariImage}
                alt={`Use the Websites tab in Safari's preferences to manage ${devicesToFriendlyName(
                    devices,
                    "and"
                )} permissions.`}
            />
        </>
    );
}

export function PermissionInstructionsOther(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Clowdr to access the {devicesToFriendlyName(devices)}.
                Please check your browser settings and try again.
            </Text>
        </>
    );
}

function PermissionInstructionsMacOs(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                Using macOS?
            </Heading>
            <Text>
                macOS will not allow your browser to access the {devicesToFriendlyName(devices)} unless you have given
                permission to do so. You may find the following helpful:
            </Text>
            <List>
                <ListItem>
                    {devices.camera ? (
                        <Link isExternal href="https://support.apple.com/en-gb/guide/mac-help/mchlf6d108da/mac">
                            Control access to the camera on your Mac
                        </Link>
                    ) : undefined}
                </ListItem>
                <ListItem>
                    {devices.microphone ? (
                        <Link isExternal href="https://support.apple.com/en-gb/guide/mac-help/mchla1b1e1fe/mac">
                            Control access to the microphone on your Mac
                        </Link>
                    ) : undefined}
                </ListItem>
                <ListItem>
                    {devices.screen ? (
                        <Link isExternal href="https://support.apple.com/en-gb/guide/mac-help/mchld6aa7d23/mac">
                            Control access to screen recording on your Mac
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
                Check other applications
            </Heading>
            <Text>
                Make sure you have fully exited other video applications like Zoom, Skype or Google Meet. These may
                prevent Clowdr from accessing your camera or microphone.
            </Text>
        </>
    );
}
