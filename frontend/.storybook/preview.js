import { generateDefaultTheme } from "../src/aspects/Chakra/ChakraCustomProvider";

export const parameters = {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    chakra: {
        theme: generateDefaultTheme(),
    },
    // backgrounds: {
    //     default: "Grey Page - Light",
    //     values: [
    //         {
    //             name: "Grey Page - Light",
    //             value: "var(--chakra-colors-gray-50)",
    //         },
    //         {
    //             name: "Grey Page - Dark",
    //             value: "var(--chakra-colors-gray-50)",
    //         },
    //     ],
    // },
};
