import { As, Button, chakra, PropsOf, useBreakpointValue } from "@chakra-ui/react";
import React, { forwardRef } from "react";
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
    { label, iconStyle, icon, children, ...props }: React.PropsWithChildren<Props>,
    ref
): JSX.Element {
    const size = useBreakpointValue({
        base: "md",
        lg: "lg",
    });
    return (
        <Button
            aria-label={label}
            size={size}
            p={0}
            minW="100%"
            ref={ref}
            textAlign="left"
            justifyContent="flex-start"
            {...props}
        >
            {typeof icon === "string" ? (
                <FAIcon iconStyle={iconStyle} icon={icon} ml={3} mr={2} />
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
            <chakra.span fontSize="sm" ml={1} mr={2}>
                {label}
            </chakra.span>
            {children}
        </Button>
    );
});

export default MenuButton;
