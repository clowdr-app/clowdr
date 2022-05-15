import {
    Button,
    chakra,
    Divider,
    Heading,
    Image,
    Link,
    List,
    ListItem,
    OrderedList,
    Text,
    VStack,
} from "@chakra-ui/react";
import { detect } from "detect-browser";
import React, { useMemo, useState } from "react";
import FAIcon from "../../../../Chakra/FAIcon";
import chromeImage from "./images/chrome-permissions.png";
import chromeScreenShareImage from "./images/chrome-screenshare.png";
import firefoxImage from "./images/firefox-permissions.png";
import safariImage from "./images/safari-permissions.png";
import type { DevicesProps } from "./PermissionInstructionsContext";

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

export function PermissionInstructions({
    reason,
    onClose,
    ...props
}: { reason?: string | null; onClose?: () => void } & DevicesProps): JSX.Element {
    const detected = useMemo(() => detect(), []);

    const reasonOption = useMemo(() => {
        if (!reason) {
            return "unknown";
        }

        if (reason.startsWith("Browser error: Screen-share unavailable")) {
            return "screenshare-in-use";
        } else if (reason.startsWith("Permission to share screen denied")) {
            return "screenshare-denied";
        } else if (reason.startsWith("Browser error: Failed to share screen")) {
            return "screenshare-failed";
        } else if (reason.startsWith("Browser error: Unable to list")) {
            return "list-devices-failed";
        } else if (reason.startsWith("No") && reason.endsWith("available")) {
            return "no-devices";
        } else if (reason.startsWith("Permission to access") && reason.endsWith("denied")) {
            return "device-denied";
        } else if (reason.startsWith("Browser error:") && reason.includes("unavailable")) {
            return "device-in-use";
        } else if (reason.startsWith("Browser error: Unable to access")) {
            return "device-failed";
        } else if (reason.startsWith("Browser error: Failed to")) {
            return "device-failed";
        } else {
            return "unknown";
        }
    }, [reason]);

    const steps = useMemo(() => {
        let result: (
            | "browser-device-permissions"
            | "browser-screenshare-permissions"
            | "os-device-permissions"
            | "os-screenshare-permissions"
            | "system-restart"
            | "device-in-use"
            | "screenshare-in-use"
            | "unplug-restart-device"
        )[];

        switch (reasonOption) {
            case "device-denied":
                result = ["browser-device-permissions", "os-device-permissions", "system-restart", "device-in-use"];
                break;
            case "device-failed":
                result = [
                    "unplug-restart-device",
                    "device-in-use",
                    "system-restart",
                    "os-device-permissions",
                    "browser-device-permissions",
                ];
                break;
            case "device-in-use":
                result = [
                    "device-in-use",
                    "unplug-restart-device",
                    "system-restart",
                    "os-device-permissions",
                    "browser-device-permissions",
                ];
                break;
            case "list-devices-failed":
                result = ["browser-device-permissions", "os-device-permissions", "system-restart"];
                break;
            case "no-devices":
                result = ["unplug-restart-device"];
                break;
            case "screenshare-denied":
                result = [
                    "browser-screenshare-permissions",
                    "os-screenshare-permissions",
                    "system-restart",
                    "screenshare-in-use",
                ];
                break;
            case "screenshare-failed":
                result = [
                    "screenshare-in-use",
                    "system-restart",
                    "os-screenshare-permissions",
                    "browser-device-permissions",
                ];
                break;
            case "screenshare-in-use":
                result = [
                    "screenshare-in-use",
                    "system-restart",
                    "os-screenshare-permissions",
                    "browser-device-permissions",
                ];
                break;
            case "unknown":
                result = ["browser-device-permissions", "os-device-permissions", "system-restart", "device-in-use"];
                break;
        }

        return result;
    }, [reasonOption]);

    const [currentStep, setCurrentStep] = useState<number>(0);
    const currentStepName = steps[currentStep];
    const [showInstructions, setShowInstructions] = useState<boolean>(false);
    return (
        <>
            <VStack spacing={4} alignItems="flex-start">
                {currentStep < steps.length ? (
                    <Text>
                        Step {currentStep + 1} of {steps.length}
                    </Text>
                ) : undefined}
                <Heading as="h3" textAlign="left" fontSize="lg">
                    {currentStepName === "browser-device-permissions"
                        ? "Please check the permissions in your browser"
                        : currentStepName === "device-in-use"
                        ? "Please close any other applications that may be using your device"
                        : currentStepName === "browser-screenshare-permissions"
                        ? "Please check the permissions in your browser"
                        : currentStepName === "os-device-permissions"
                        ? "Please check the permissions in your operating system preferences/settings"
                        : currentStepName === "os-screenshare-permissions"
                        ? "Please check the permissions in your operating system preferences/settings"
                        : currentStepName === "screenshare-in-use"
                        ? "Please close any other applications that may be sharing your screen"
                        : currentStepName === "system-restart"
                        ? "Please restart your computer"
                        : currentStepName === "unplug-restart-device"
                        ? "Please try unplugging your device and plugging it back in again"
                        : "No more steps to try..."}
                </Heading>
                {currentStep < steps.length ? (
                    <>
                        <Button
                            onClick={() => setShowInstructions(true)}
                            colorScheme="blue"
                            whiteSpace="normal"
                            w="100%"
                        >
                            <FAIcon iconStyle="s" icon="question-circle" />
                            &nbsp;&nbsp;How do I do this?
                        </Button>
                        <Button onClick={onClose} colorScheme="green" whiteSpace="normal" w="100%">
                            <FAIcon iconStyle="s" icon="check-circle" />
                            &nbsp;&nbsp;I have now tried this
                        </Button>
                        <Button
                            onClick={() => {
                                setCurrentStep((old) => old + 1);
                                setShowInstructions(false);
                            }}
                            colorScheme="red"
                            whiteSpace="normal"
                            w="100%"
                        >
                            <FAIcon iconStyle="s" icon="times-circle" />
                            &nbsp;&nbsp;I have tried this before and it didn&apos;t work
                        </Button>
                    </>
                ) : (
                    <>
                        <Text>
                            Sorry, we have run out of things for you to try. Please contact your conference support team
                            for assistance.
                        </Text>
                        <Text>
                            Please include the error message (at the top of this dialog) in your message so we can
                            provide accurate support to you.
                        </Text>
                    </>
                )}
                {showInstructions ? (
                    <>
                        <Divider />
                        {currentStepName === "browser-device-permissions" ? (
                            detected?.name === "chrome" ? (
                                <DevicePermissionInstructionsChrome {...props} />
                            ) : detected?.name === "firefox" ? (
                                <DevicePermissionInstructionsFirefox {...props} />
                            ) : detected?.name === "safari" ? (
                                <DevicePermissionInstructionsSafari {...props} />
                            ) : (
                                <DevicePermissionInstructionsOther {...props} />
                            )
                        ) : currentStepName === "browser-screenshare-permissions" ? (
                            detected?.name === "chrome" ? (
                                <DevicePermissionInstructionsChrome {...props} />
                            ) : detected?.name === "firefox" ? (
                                <DevicePermissionInstructionsFirefox {...props} />
                            ) : detected?.name === "safari" ? (
                                <DevicePermissionInstructionsSafari {...props} />
                            ) : (
                                <DevicePermissionInstructionsOther {...props} />
                            )
                        ) : currentStepName === "device-in-use" ? (
                            <Text>
                                Please close any applications that may be using your{" "}
                                {devicesToFriendlyName(props, "or")}, including any applications that may be running in
                                the background. Common examples are Zoom, Microsoft Teams, Google Chat, Webex, Slack and
                                Discord.
                            </Text>
                        ) : currentStepName === "os-device-permissions" ? (
                            detected?.os === "Mac OS" ? (
                                <PermissionInstructionsMacOs {...props} />
                            ) : detected?.os === "iOS" ? (
                                <PermissionInstructionsiOs {...props} />
                            ) : detected?.os?.includes("Windows") ? (
                                <PermissionInstructionsWindows {...props} />
                            ) : detected?.os === "android" || detected?.os === "Android OS" ? (
                                <PermissionInstructionsAndroid {...props} />
                            ) : (
                                <DevicePermissionInstructionsOther />
                            )
                        ) : currentStepName === "os-screenshare-permissions" ? (
                            detected?.os === "Mac OS" ? (
                                <PermissionInstructionsMacOs {...props} />
                            ) : detected?.os === "iOS" ? (
                                <PermissionInstructionsiOs {...props} />
                            ) : detected?.os?.includes("Windows") ? (
                                <PermissionInstructionsWindows {...props} />
                            ) : detected?.os === "android" || detected?.os === "Android OS" ? (
                                <PermissionInstructionsAndroid {...props} />
                            ) : (
                                <DevicePermissionInstructionsOther />
                            )
                        ) : currentStepName === "screenshare-in-use" ? (
                            <Text>
                                Please close any applications that may be using your{" "}
                                {devicesToFriendlyName(props, "or")}, including any applications that may be running in
                                the background.
                            </Text>
                        ) : currentStepName === "system-restart" ? (
                            <Text>
                                Please restart your computer. It is often necessary to restart your computer after
                                making changes to permissions or changing devices. This enables the operating system to
                                grant your web browser any additional permissions and apply any necessary updates.
                            </Text>
                        ) : currentStepName === "unplug-restart-device" ? (
                            <Text>
                                Please try unplugging your device and plugging it back in again. This will restart the
                                device and ensure your operating system&apos;s is correctly handling the device. If your
                                device is wireless, please try turning it off, wait 10 seconds, then turn it back on
                                again and reconnect it.
                            </Text>
                        ) : undefined}
                    </>
                ) : undefined}
            </VStack>
        </>
    );
    // const browserInstructionsEl = useMemo(() => {
    //
    // }, [detected?.name, props]);

    // const osInstructionsEl = useMemo(() => {
    //     switch (detected?.os as string) {
    //         case "Mac OS":
    //             return <PermissionInstructionsMacOs {...props} />;
    //         case "iOS":
    //             return <PermissionInstructionsiOs {...props} />;
    //         case "Windows 8":
    //         case "Windows 8.1":
    //         case "Windows 10":
    //         case "Windows 11":
    //             return <PermissionInstructionsWindows {...props} />;
    //         default:
    //             return undefined;
    //     }
    // }, [detected?.os, props]);

    // return (
    //     <>
    //         {browserInstructionsEl}
    //         {osInstructionsEl}
    //         <PermissionInstructionsOtherApplications />
    //     </>
    // );
}

const imageProps = { mx: "5%", my: 4, w: "auto", maxW: "90%", boxShadow: "lg", rounded: "xl" };

export function DevicePermissionInstructionsChrome(devices: DevicesProps): JSX.Element {
    return (
        <>
            {devices.camera || devices.microphone ? (
                <>
                    <Text>
                        It seems that your web browser is not allowing Midspace to access the{" "}
                        {devicesToFriendlyName(devices, "or")}. Update your settings by clicking the icon in the address
                        bar and setting the Camera and Microphone permissions to Allow.
                    </Text>
                    <Image
                        {...imageProps}
                        src={chromeImage}
                        maxH="50vh"
                        alt="Use the permissions controls in the left end of the Chrome address bar to manage camera and microphone permissions."
                    />
                    <Text>
                        If you need more help, see the{" "}
                        <Link
                            isExternal
                            href="https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DDesktop"
                        >
                            official Google Chrome instructions
                        </Link>
                        .
                    </Text>
                </>
            ) : undefined}
            {devices.screen ? (
                <>
                    <Text>
                        The screen could not be shared. Did you click <em>Cancel</em>?
                    </Text>
                    <Text>
                        To share, choose a screen, window or tab and click the <em>Share</em> button.
                    </Text>
                    <Image
                        {...imageProps}
                        src={chromeScreenShareImage}
                        maxH="50vh"
                        alt="The Chrome 'Choose what to share' dialog, showing the list of tabs that can be shared."
                    />
                </>
            ) : undefined}
        </>
    );
}

export function DevicePermissionInstructionsFirefox(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Midspace to access the{" "}
                {devicesToFriendlyName(devices, "or")}. Remove any blocked devices by clicking the icon in the address
                bar and then the appropriate x button.
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

export function DevicePermissionInstructionsSafari(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Midspace to access the{" "}
                {devicesToFriendlyName(devices, "or")}. You may need to tell Safari to allow this. Open{" "}
                <em>Safari &rarr; Preferences...</em> and go to the <em>Website</em> tab. Choose to &lsquo;Allow&rsquo;
                access to the {devicesToFriendlyName(devices, "and")} on <em>{window.location.host ?? "Midspace"}</em>.
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

export function DevicePermissionInstructionsOther(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Text>
                It seems that your web browser is not allowing Midspace to access the{" "}
                {devicesToFriendlyName(devices, "or")}. Please check your browser settings and try again.
            </Text>
        </>
    );
}

export function PermissionInstructionsMacOs(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                Using macOS?
            </Heading>
            <Text>
                macOS will not allow your browser to access a {devicesToFriendlyName(devices, "or")} unless you have
                given permission to do so.{" "}
                {devices.screen
                    ? "Permissions controls for screen recording were introduced in macOS Catalina (10.15). "
                    : ""}
                You may find the following helpful:
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

export function PermissionInstructionsiOs(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                Using iOS?
            </Heading>
            <Text>
                iOS will not allow your browser to access a {devicesToFriendlyName(devices, "or")} unless you have given
                permission to do so.{" "}
                {devices.screen
                    ? "Permissions controls for screen recording were introduced in macOS Catalina (10.15). "
                    : ""}
                iOS uses similar permissions to macOS. You may find the following helpful:
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

export function PermissionInstructionsWindows(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                Using Windows?
            </Heading>
            <Text>
                Windows will not allow your browser to access a {devicesToFriendlyName(devices, "or")} unless you have
                given permission to do so. In Windows 10 and Windows 11, you can set these permissions by following
                these steps:
            </Text>
            <OrderedList listStylePos="inside">
                <ListItem>Click on the Start Menu (in the bottom left corner)</ListItem>
                <ListItem>Click on the Settings cog</ListItem>
                {devices.camera || devices.screen ? (
                    <>
                        <ListItem>Search for &ldquo;Camera privacy settings&rdquo;</ListItem>
                        <ListItem>Turn on &ldquo;Allow apps to access your camera&rdquo;</ListItem>
                        <ListItem>Turn on &ldquo;Allow desktop apps to access your camera&rdquo;</ListItem>
                        <ListItem>
                            Your browser might be listed under the section &ldquo;Choose which Microsoft Store apps can
                            access your camera&rdquo;. If it is, ensure access is turned on.
                            <br />
                            <br />
                            <chakra.span fontSize="sm">
                                <i>Do not worry if your browser is not listed. This is not a problem.</i>
                            </chakra.span>
                            <br />
                            <br />
                            <chakra.span fontSize="sm">
                                <i>
                                    If your browser is listed under the Desktop Apps section, you do not need to do
                                    anything further.
                                </i>
                            </chakra.span>
                        </ListItem>
                    </>
                ) : undefined}
                {devices.microphone ? (
                    <>
                        <ListItem>Search for &ldquo;Microphone privacy settings&rdquo;</ListItem>
                        <ListItem>Turn on &ldquo;Allow apps to access your microphone&rdquo;</ListItem>
                        <ListItem>Turn on &ldquo;Allow desktop apps to access your microphone&rdquo;</ListItem>
                        <ListItem>
                            Your browser might be listed under the section &ldquo;Choose which Microsoft Store apps can
                            access your microphone&rdquo;. If it is, ensure access is turned on.
                            <br />
                            <chakra.span fontSize="sm">
                                <i>Do not worry if your browser is not listed. This is not a problem.</i>
                            </chakra.span>
                            <br />
                            <chakra.span fontSize="sm">
                                <i>
                                    If your browser is listed under the Desktop Apps section, you do not need to do
                                    anything further.
                                </i>
                            </chakra.span>
                        </ListItem>
                    </>
                ) : undefined}
            </OrderedList>
        </>
    );
}

export function PermissionInstructionsAndroid(devices: DevicesProps): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                Using Android?
            </Heading>
            <Text>
                Android will not allow your browser to access a {devicesToFriendlyName(devices, "or")} unless you have
                given permission to do so. In recent versions of Android, you can set these permissions by following
                these steps:
            </Text>
            <OrderedList listStylePos="inside">
                <ListItem>Find the icon for your browser on your home screen or in your app list</ListItem>
                <ListItem>Tap-and-hold on the browser icon until the menu appears</ListItem>
                <ListItem>Tap the &ldquo;i&rdquo; icon</ListItem>
                <ListItem>Tap &ldquo;Permissions&rdquo;</ListItem>
                <ListItem>Under &ldquo;Not allowed&rdquo;, tap {devicesToFriendlyName(devices, "or")}</ListItem>
                <ListItem>
                    Select &ldquo;Allow only while using the app&rdquo; or &ldquo;Ask every time&rdquo; (whichever you
                    prefer)
                </ListItem>
                <ListItem>
                    Go back and repeat the previous steps for {devicesToFriendlyName(devices, "or")} as necessary.
                </ListItem>
            </OrderedList>
        </>
    );
}

export function PermissionInstructionsOtherApplications(): JSX.Element {
    return (
        <>
            <Heading as="h2" size="sm" textAlign="left" mb={2} mt={4}>
                Check other applications
            </Heading>
            <Text>
                Make sure you have fully exited other video applications like Zoom, Skype or Google Meet. These may
                prevent Midspace from accessing your camera or microphone.
            </Text>
        </>
    );
}
