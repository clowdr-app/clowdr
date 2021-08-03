import { As, Button, PropsOf, useBreakpointValue } from "@chakra-ui/react";
import React, { forwardRef } from "react";
import { defaultOutline_AsBoxShadow } from "../../Chakra/Outline";
import { FAIcon } from "../../Icons/FAIcon";

type Props<T extends As<any> = typeof Button> = PropsOf<T> & {
    label: string;
    iconStyle: "b" | "s" | "r";
    icon: string | string[];
    side: "left" | "right";
    noTooltip?: boolean;
};

function intermingle<T>(fn: (idx: number) => T) {
    function inner(xs: ((idx: number) => T)[]) {
        return xs.flatMap((x, i) => (i === 0 ? [x(0)] : [fn(2 * i - 1), x(2 * i)]));
    }
    return inner;
}

const MenuButton = forwardRef<HTMLButtonElement, Props>(function MenuButton(
    { label, iconStyle, icon, side, children, ...props }: React.PropsWithChildren<Props>,
    ref
): JSX.Element {
    const size = useBreakpointValue({
        base: "md",
        lg: "lg",
    });
    const expandedFontSize = useBreakpointValue({
        base: "lg",
        lg: "xl",
    });
    return (
        <Button
            aria-label={label}
            size={size}
            color="white"
            p={0}
            minW="100%"
            _hover={{
                fontSize: expandedFontSize,
                borderLeftRadius: side === "right" ? 2 : undefined,
                borderRightRadius: side === "left" ? 2 : undefined,
            }}
            _focus={{
                fontSize: expandedFontSize,
                borderLeftRadius: side === "right" ? 2 : undefined,
                borderRightRadius: side === "left" ? 2 : undefined,
                boxShadow: defaultOutline_AsBoxShadow,
            }}
            ref={ref}
            {...props}
        >
            {typeof icon === "string" ? (
                <FAIcon iconStyle={iconStyle} icon={icon} />
            ) : (
                intermingle((idx) => <span key={idx}>&nbsp;/&nbsp;</span>)(
                    icon.map(
                        (ic) =>
                            function ButtonIcon(idx: number) {
                                return <FAIcon key={idx} iconStyle={iconStyle} icon={ic} />;
                            }
                    )
                )
            )}
            {children}
        </Button>
    );
});

export default MenuButton;
