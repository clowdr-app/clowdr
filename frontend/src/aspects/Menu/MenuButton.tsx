import type { As, PropsOf } from "@chakra-ui/react";
import { Button, chakra, Tooltip } from "@chakra-ui/react";
import React, { forwardRef } from "react";
import FAIcon from "../Chakra/FAIcon";

type Props<T extends As<any> = typeof Button> = PropsOf<T> & {
    label: string;
    iconStyle: "b" | "s" | "r";
    icon: string | string[];
    side: "left" | "right";
    noTooltip?: boolean;
    showLabel: boolean;
    ariaLabel?: string;
};

// function intermingle<T>(fn: (idx: number) => T) {
//     function inner(xs: ((idx: number) => T)[]) {
//         return xs.flatMap((x, i) => (i === 0 ? [x(0)] : [fn(2 * i - 1), x(2 * i)]));
//     }
//     return inner;
// }

const MenuButton = forwardRef<HTMLButtonElement, Props>(function MenuButton(
    { ariaLabel, label, showLabel, iconStyle, icon, children, ...props }: React.PropsWithChildren<Props>,
    ref
): JSX.Element {
    const button = (
        <Button
            aria-label={ariaLabel ?? label}
            p={2}
            pl={3}
            w="100%"
            overflow="hidden"
            minW="100%"
            ref={ref}
            textAlign="left"
            justifyContent="flex-start"
            fontSize="lg"
            {...props}
        >
            {typeof icon === "string" ? (
                <FAIcon iconStyle={iconStyle} icon={icon} w={6} mr={3} textAlign="center" />
            ) : (
                icon.map((ic, idx) => <FAIcon key={idx} iconStyle={iconStyle} icon={ic} />)
            )}
            {<chakra.span fontSize="sm">{label}</chakra.span>}
            {children}
        </Button>
    );
    return !showLabel ? (
        <Tooltip label={label} hasArrow placement="right">
            {button}
        </Tooltip>
    ) : (
        button
    );
});

export default MenuButton;
