import type { ComponentMap } from "./Types";

const componentMap: ComponentMap = {
    AppPageV1: {
        centerColumnBackground: {
            light: "gray.100",
            dark: "gray.800",
        },
        centerColumnBorders: {
            light: "gray.200",
            dark: "gray.600",
        },
    },
    AppPageV2: {
        pageBackground: {
            light: "gray.50",
            dark: "gray.900",
        },
        pageBorders: {
            light: "gray.200",
            dark: "gray.600",
        },
    },
    ProtectedRoute: generateColorScheme("red"),
    LeftMenu: generateColorScheme("pink"),
    LeftMenuButton: generateColorScheme("pink"),
    RightMenu: generateColorScheme("purple"),
    RightMenuButton: generateColorScheme("purple"),
    LoginButtonWithinPage: generateColorScheme("purple"),
    LogoutButtonWithinPage: generateColorScheme("red"),
    SignUpButtonWithinPage: generateColorScheme("purple"),
    ConfirmButton: generateColorScheme("green"),
    PrimaryActionButton: {
        ...generateColorScheme("purple"),
        textColor: "white",
    },
    SecondaryActionButton: generateColorScheme("pink"),
    LiveActionButton: generateColorScheme("green"),
    DestructiveActionButton: generateColorScheme("red"),
    "ProfileBadge-Default": generateColorScheme("gray"),
    ProfileBadge: {
        textColor: { dark: "gray.50", light: "gray.900" },
    },
    Input: {
        textColor: { light: "gray.900", dark: "gray.50" },
        borderColor: { light: "gray.500", dark: "gray.400" },
    },
    FormInputError: {
        textColor: "red.400",
    },
    Notification: {
        backgroundColor: "purple.800",
        textColor: "gray.50",
    },
    ChatError: {
        backgroundColor: { light: "gray.100", dark: "gray.800" },
        textColor: { light: "gray.900", dark: "gray.50" },
    },
    ChatCompose: {
        borderColor: { light: "gray.700", dark: "gray.300" },
        borderColorFaded: { light: "gray.300", dark: "gray.500" },
        answeringMessageBorderColor: "gray.400",
    },
    ChatAddEmojiButton: {
        color: { light: "purple.600", dark: "purple.200" },
        focusColor: { light: "yellow.500", dark: "yellow.500" },
        activeColor: { light: "yellow.500", dark: "yellow.500" },
    },
    ChatSendMessageButton: {
        ...generateColorScheme("purple"),
        color: { light: "purple.600", dark: "purple.200" },
        focusColor: { light: "purple.400", dark: "purple.500" },
        activeColor: { light: "purple.700", dark: "purple.200" },
    },
    ChatPinButton: generateColorScheme("purple"),
    ChatSubscribeButton: generateColorScheme("yellow"),
    ChatSettingsButton: generateColorScheme("gray"),
    ChatMessageList: {
        scrollbarHandleColor: { light: "gray.500", dark: "gray.200" },
        scrollbarBackgroundColor: { light: "gray.200", dark: "gray.500" },
        endReachedBorderColor: "gray.400",
    },
    ChatMessage: {
        timeColor: { light: "gray.600", dark: "gray.400" },
        nameColor: { light: "gray.600", dark: "gray.400" },
        messageBgColor: { light: "gray.50", dark: "gray.900" },
        questionBgColor: { light: "pink.50", dark: "pink.900" },
        answerBgColor: { light: "green.50", dark: "green.900" },
    },
    ChatMessageAnswerButton: generateColorScheme("pink"),
    ChatMessageAnswerAgainButton: generateColorScheme("purple"),
    ChatEditMessageButton: {
        color: "cyan.400",
    },
    ChatManagePollButton: {
        color: "cyan.400",
    },
    ChatAddReactionButton: {
        color: "yellow.400",
    },
    ChatReaction: {
        textColor: { dark: "gray.50", light: "gray.900" },
        borderColor: { light: "gray.400", dark: "gray.500" },
        "backgroundColor-Sender": { light: "gray.300", dark: "gray.500" },
    },
    MessageTypeSelectorButton: {
        ...generateColorScheme("purple"),
        "textColor-Selected": { light: "gray.50", dark: "gray.900" },
    },
    UseOrCreateInviteView: {
        dividerColor: { light: "gray.200", dark: "gray.700" },
    },
    ProgramPersonTile: {
        textColor: { light: "gray.900", dark: "gray.50" },
        backgroundColor: { light: "gray.100", dark: "gray.800" },
    },
    ProgramPersonTileRoleNameBadge: {
        authorColor: "purple",
        chairColor: "yellow",
        presenterColor: "pink",
        discussantColor: "pink",
        sessionOrganizerColor: "pink",
        defaultColor: "pink",
    },
    EventsTable: {
        ...generateColorScheme("purple"),
        happeningSoonBackgroundColor: { light: "green.500", dark: "green.400" },
        starEventCellBackgroundColor: "gray.900",
    },
    ItemExhibitionLinkButton: {
        borderColor: { light: "gray.300", dark: "gray.600" },
        defaultBackgroundColor: { light: "gray.200", dark: "gray.600" },
        textColor: { light: "gray.50", dark: "gray.900" },
        "textColor-Hover": { light: "gray.50", dark: "gray.900" },
        "textColor-Active": { light: "gray.50", dark: "gray.900" },
    },
    "TagBrowser-Tag": {
        "defaultBackgroundColor-Unselected": { light: "pink.200", dark: "pink.700" },
        "defaultBackgroundColor-Selected": { light: "pink.300", dark: "pink.500" },
        textColor: { light: "white", dark: "black" },
    },
    "TagBrowser-Item": {
        ...generateColorScheme("gray"),
    },
    Exhibition: {
        textColor: { light: "black", dark: "white" },
        tileBorderColor: { light: "gray.300", dark: "gray.600" },
        defaultBackgroundColor: { light: "pink.300", dark: "pink.600" },
    },
    "EditProfilePage-ContinueButton": generateColorScheme("purple"),
    MyBackstages: {
        ...generateColorScheme("pink"),
        liveNowBackgroundColor: { light: "red.300", dark: "red.600" },
        backstageAvailableBackgroundColor: { light: "green.300", dark: "green.600" },
        availableSoonBackgroundColor: { light: "yellow.300", dark: "yellow.600" },
    },
    "Profile-AffiliationLink": generateColorScheme("pink"),
    MyRecordings: {
        tileBackgroundColor: { light: "gray.200", dark: "gray.700" },
    },
    Room: {
        videoChatBackgroundColor: { light: "gray.200", dark: "gray.700" },
        currentEventBackgroundColor: { light: "purple.100", dark: "purple.900" },
        nextEventBackgroundColor: { light: "gray.200", dark: "gray.700" },
        sponsorLogoBackgroundColor: "white",
    },
    "Room-CurrentEventRoleLabel": generateColorScheme("purple"),
    "Room-NextEventRoleLabel": generateColorScheme("gray"),
    StreamText: {
        backgroundColor: { light: "gray.50", dark: "gray.900" },
        foregroundColor: { light: "black", dark: "white" },
    },
    Backstage: {
        offAirBorderColor: { light: "gray.100", dark: "gray.900" },
        onAirBorderColor: { light: "red", dark: "red" },
    },
    "Backstage-LiveIndicator-OnAirLabel": generateColorScheme("red"),
    "Backstage-LiveIndicator-OffAirLabel": generateColorScheme("purple"),
    "Backstage-LiveIndicator-10sCountdown": {
        backgroundColor1: "red",
        backgroundColor2: "black",
        textColor: "white",
    },
};

function generateColorScheme(colorName: string): Record<string, string> {
    return {
        "50": `${colorName}.50`,
        "100": `${colorName}.100`,
        "200": `${colorName}.200`,
        "300": `${colorName}.300`,
        "400": `${colorName}.400`,
        "500": `${colorName}.500`,
        "600": `${colorName}.600`,
        "700": `${colorName}.700`,
        "800": `${colorName}.800`,
        "900": `${colorName}.900`,
    };
}

export default componentMap;
