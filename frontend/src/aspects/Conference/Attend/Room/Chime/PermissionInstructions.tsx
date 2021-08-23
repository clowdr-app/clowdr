import { Image, Link, Text } from "@chakra-ui/react";
import { detect } from "detect-browser";
import React, { useMemo } from "react";
import chromeImage from "./images/chrome-permissions.png";
import firefoxImage from "./images/firefox-permissions.png";

export function PermissionInstructions(): JSX.Element {
    const browser = useMemo(() => detect()?.name, []);

    const element = useMemo(() => {
        switch (browser) {
            case "chrome":
                return <PermissionInstructionsChrome />;
            case "firefox":
                return <PermissionInstructionsFirefox />;
            default:
                return <PermissionInstructionsOther />;
        }
    }, [browser]);

    return element;
}

export function PermissionInstructionsChrome(): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Midspace to access the camera or microphone. Update your
                settings by clicking the icon in the address bar and setting the Camera and Microphone permissions to
                Allow.
            </Text>
            <Image
                m={2}
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
            <PermissionInstructionsOtherApplications />
        </>
    );
}

export function PermissionInstructionsFirefox(): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Midspace to access the camera or microphone. Remove any
                blocked devices by clicking the icon in the address bar and then the appropriate x button.
            </Text>
            <Image
                m={2}
                src={firefoxImage}
                alt="Use the permissions controls in the left end of the Firefox address bar to manage camera and microphone permissions."
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
            <PermissionInstructionsOtherApplications />
        </>
    );
}

export function PermissionInstructionsOther(): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Midspace to access the camera or microphone. Please check
                your browser settings and try again.
            </Text>
            <PermissionInstructionsOtherApplications />
        </>
    );
}

function PermissionInstructionsOtherApplications(): JSX.Element {
    return (
        <Text>
            Make sure you have fully exited other video applications like Zoom, Skype or Google Meet. These may prevent
            Midspace from accessing your camera or microphone.
        </Text>
    );
}
