import { ChakraProvider, extendTheme, PortalManager } from "@chakra-ui/react";
import React from "react";

// https://themera.vercel.app/
// const colors = {
//     white: "#fcfcfc",
//     focus: {
//         400: "rgba(255, 187, 0, 0.8)",
//     },
//     gray: {
//         50: "#f9f9fc",
//         100: "#efeff3",
//         200: "#e0e8e4",
//         300: "#bbb",
//         400: "#999",
//         500: "#555566",
//         600: "#444455",
//         700: "#333344",
//         800: "#222233",
//         900: "#111122",
//     },
//     green: {
//         "50": "#EAFBF1",
//         "100": "#C3F3D9",
//         "200": "#9DECC1",
//         "300": "#77E4A9",
//         "400": "#50DD90",
//         "500": "#2AD578",
//         "600": "#21AB60",
//         "700": "#198048",
//         "800": "#115530",
//         "900": "#082B18",
//     },
//     yellow: {
//         "50": "#FBFCE8",
//         "100": "#F4F8BF",
//         "200": "#EDF395",
//         "300": "#E6EF6C",
//         "400": "#DFEA42",
//         "500": "#D8E619",
//         "600": "#ADB814",
//         "700": "#818A0F",
//         "800": "#565C0A",
//         "900": "#2B2E05",
//     },
//     blue: {
//         "50": "#E5FBFF",
//         "100": "#B8F4FF",
//         "200": "#8AEDFF",
//         "300": "#5CE6FF",
//         "400": "#2EDFFF",
//         "500": "#00D8FF",
//         "600": "#00ADCC",
//         "700": "#008299",
//         "800": "#005766",
//         "900": "#002B33",
//     },
//     purple: {
//         "50": "#FAEAF6",
//         "100": "#F1C5E6",
//         "200": "#E8A0D6",
//         "300": "#DF7BC6",
//         "400": "#D756B6",
//         "500": "#CE31A6",
//         "600": "#A52785",
//         "700": "#7B1E64",
//         "800": "#521442",
//         "900": "#290A21",
//     },
// };

// https://javisperez.github.io/tailwindcolorshades/?saffron=f1c52c&pear=deea3e&plum=7d1e65&casal=005f70&fun-green=16703f
const colors = {
    white: "#fcfcfc",
    yellow: {
        // "50": "#fefcf4",
        // "100": "#fef9ea",
        // "200": "#fcf1ca",
        // "300": "#f9e8ab",
        // "400": "#f5d66b",
        // "500": "#f1c52c",
        // "600": "#d9b128",
        // "700": "#b59421",
        // "800": "#91761a",
        // "900": "#766116",
        "50": "#FFFCF0",
        "100": "#FFF7DB",
        "200": "#FFEEB2",
        "300": "#FFE58A",
        "400": "#FFDD61",
        "500": "#FFD438",
        "600": "#FFCA0A",
        "700": "#DBAC00",
        "800": "#AD8800",
        "900": "#7F6400",
    },
    green: {
        "50": "#D9EDE2",
        "100": "#C9E6D6",
        "200": "#AAD7BF",
        "300": "#8BC8A7",
        "400": "#6BBA8F",
        "500": "#4FA878",
        "600": "#408962",
        "700": "#326A4B",
        "800": "#234A35",
        "900": "#142B1F",
    },
    purple: {
        "50": "#f9f4f7",
        "100": "#f2e9f0",
        "200": "#dfc7d9",
        "300": "#cba5c1",
        "400": "#a46293",
        "500": "#7d1e65",
        "600": "#711b5b",
        "700": "#5e174c",
        "800": "#4b123d",
        "900": "#3d0f31",
    },
    blue: {
        "50": "#E4F6F9",
        "100": "#CAECF2",
        "200": "#94D9E5",
        "300": "#5FC6D8",
        "400": "#30AFC5",
        "500": "#238090",
        "600": "#1D6A77",
        "700": "#17545E",
        "800": "#113E46",
        "900": "#0B282D",
    },
};

export const defaultOutline_AsBoxShadow = "0 0 0 2px rgba(255, 187, 0, 0.8)";

const theme = extendTheme({
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
        "light-md": "0 4px 6px -1px rgba(255, 255, 255, 0.1),0 2px 4px -1px rgba(255, 255, 255, 0.04)",
        "bottom-popup-light": "0px -1px 4px 0px rgba(0,0,0,0.25)",
        "bottom-popup-dark": "0px -1px 4px 0px rgba(255,255,255,0.25)",
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
