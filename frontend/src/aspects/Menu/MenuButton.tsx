import type { As, PropsOf } from "@chakra-ui/react";
import { Button, chakra, useBreakpointValue } from "@chakra-ui/react";
import React, { forwardRef } from "react";
import { FAIcon } from "../Icons/FAIcon";

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
    const size = useBreakpointValue({
        base: "md",
        lg: "lg",
    });
    return (
        <Button
            aria-label={ariaLabel ?? label}
            size={size}
            p={2}
            pr={3}
            minW="100%"
            ref={ref}
            textAlign="left"
            justifyContent={showLabel ? "flex-start" : "center"}
            {...props}
        >
            {typeof icon === "string" ? (
                <FAIcon iconStyle={iconStyle} icon={icon} w={6} mr={showLabel ? 2 : 0} textAlign="center" />
            ) : (
                icon.map((ic, idx) => <FAIcon key={idx} iconStyle={iconStyle} icon={ic} />)
            )}
            {showLabel ? <chakra.span fontSize="sm">{label}</chakra.span> : undefined}
            {children}
        </Button>
    );
});

export default MenuButton;
