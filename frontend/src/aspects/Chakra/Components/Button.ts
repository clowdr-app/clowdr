import { ComponentSingleStyleConfig, CSSObject, keyframes } from "@chakra-ui/react";
import { defaultOutline_AsBoxShadow } from "../Outline";

const joinRoomButtonBgKeyframes = keyframes`
0% {
    background-position: 0% 100%;
}
50% {
    background-position: 100% 0%;
}
100% {
    background-position: 0% 100%;
}
    `;

const variants: { [name: string]: CSSObject } = {
    glowing: {
        animation: `${joinRoomButtonBgKeyframes} 10s ease-in-out infinite`,
        background: "linear-gradient(135deg, rgba(195,0,146,1) 20%, rgba(0,105,231,1) 50%, rgba(195,0,146,1) 80%);",
        backgroundSize: "400% 400%",
        transition: "none",
        color: "white",
        _hover: {
            background: "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
            backgroundSize: "400% 400%",
        },
        _focus: {
            background: "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
            backgroundSize: "400% 400%",
            boxShadow: defaultOutline_AsBoxShadow,
        },
        _active: {
            background: "linear-gradient(135deg, rgba(118,0,89,1) 20%, rgba(0,55,121,1) 50%, rgba(118,0,89,1) 80%);",
            backgroundSize: "400% 400%",
        },
    },
};

export const Button: ComponentSingleStyleConfig = {
    variants,
};
