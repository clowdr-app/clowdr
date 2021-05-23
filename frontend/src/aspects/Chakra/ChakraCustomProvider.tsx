import { ChakraProvider, extendTheme, PortalManager } from "@chakra-ui/react";
import React from "react";

const colors = {
    white: "#fcfcfc",
    focus: {
        400: "rgba(255, 187, 0, 0.8)",
    },
    // https://themera.vercel.app/
    gray: {
        50: "#f9f9fc",
        100: "#efeff3",
        200: "#e0e8e4",
        300: "#bbb",
        400: "#999",
        500: "#555566",
        600: "#444455",
        700: "#333344",
        800: "#222233",
        900: "#111122",
    },
    green: {
        "50": "#EAFBF1",
        "100": "#C3F3D9",
        "200": "#9DECC1",
        "300": "#77E4A9",
        "400": "#50DD90",
        "500": "#2AD578",
        "600": "#21AB60",
        "700": "#198048",
        "800": "#115530",
        "900": "#082B18",
    },
    yellow: {
        "50": "#FBFCE8",
        "100": "#F4F8BF",
        "200": "#EDF395",
        "300": "#E6EF6C",
        "400": "#DFEA42",
        "500": "#D8E619",
        "600": "#ADB814",
        "700": "#818A0F",
        "800": "#565C0A",
        "900": "#2B2E05",
    },
    blue: {
        "50": "#E5FBFF",
        "100": "#B8F4FF",
        "200": "#8AEDFF",
        "300": "#5CE6FF",
        "400": "#2EDFFF",
        "500": "#00D8FF",
        "600": "#00ADCC",
        "700": "#008299",
        "800": "#005766",
        "900": "#002B33",
    },
    purple: {
        "50": "#FAEAF6",
        "100": "#F1C5E6",
        "200": "#E8A0D6",
        "300": "#DF7BC6",
        "400": "#D756B6",
        "500": "#CE31A6",
        "600": "#A52785",
        "700": "#7B1E64",
        "800": "#521442",
        "900": "#290A21",
    },
};

export const defaultOutline_AsBoxShadow = "0 0 0 2px rgba(255, 187, 0, 0.8)";

const theme = extendTheme({
    config: {
        initialColorMode: "dark",
    },
    radii: {
        none: "0",
        sm: "0",
        base: "0.0625rem",
        md: "0.125rem",
        lg: "0.25rem",
        xl: "0.375rem",
        "2xl": "0.5rem",
        "3xl": "0.75rem",
        full: "9999px",
    },
    colors,
    shadows: {
        outline: defaultOutline_AsBoxShadow,
        "light-md": "0 4px 6px -1px rgba(190, 190, 190, 0.2),0 2px 4px -1px rgba(190, 190, 190, 0.1)",
    },
    components: {
        Heading: {
            baseStyle: {
                textAlign: "center",
            },
        },
        Link: {
            baseStyle: {
                textDecoration: "underline",
            },
        },
        Popover: {
            parts: ["popper"],
            baseStyle: (props) => ({
                popper: {
                    zIndex: 10,
                    maxW: props.width ? props.width : "xs",
                    w: "100%",
                },
            }),
        },
    },
});

export default function ChakraCustomProvider({
    children,
}: {
    children: JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    return (
        <ChakraProvider theme={theme}>
            <PortalManager>{children}</PortalManager>
        </ChakraProvider>
    );
}
