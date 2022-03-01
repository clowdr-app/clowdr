import type { ChakraProps, MergeWithAs, SystemStyleObject } from "@chakra-ui/react";
import { chakra, forwardRef } from "@chakra-ui/react";
import { cx, __DEV__ } from "@chakra-ui/utils";
import type { ForwardedRef } from "react";
import * as React from "react";

export interface IconProps extends ChakraProps {
    iconStyle: "s" | "r" | "b";
    fixedWidth?: boolean;
    icon: string;
    inline?: boolean;
}

const FAIcon = forwardRef<IconProps, "i">(function Icon(
    props: MergeWithAs<IconProps, any>,
    ref: ForwardedRef<HTMLSpanElement>
) {
    const { iconStyle, icon, fixedWidth, inline, as: element, color, className, __css, ...rest } = props;

    const _className = cx("chakra-icon", className);

    const styles: SystemStyleObject = {
        w: "auto",
        h: "auto",
        display: "inline-block",
        lineHeight: "inherit",
        flexShrink: 0,
        color,
        marginRight: inline ? "0.5em" : undefined,
        ...__css,
    };

    const shared: any = {
        ref,
        className: _className,
        __css: styles,
    };

    /**
     * If you're using an icon library like `react-icons`.
     * Note: anyone passing the `as` prop, should manage the `viewBox` from the external component
     */
    if (element && typeof element !== "string") {
        return <chakra.span as={element} {...shared} {...rest} />;
    }

    if (!icon || !iconStyle) {
        throw new Error("Icon not correctly specified!");
    }
    const iconClassName = cx(`fa${iconStyle}`, `fa-${icon}`, fixedWidth && "fa-fw");
    const iconEl = (<i className={iconClassName} />) as React.ReactNode;

    return (
        <chakra.span verticalAlign="middle" {...shared} {...rest}>
            {iconEl}
        </chakra.span>
    );
});

if (__DEV__) {
    FAIcon.displayName = "Font Awesome Icon";
}

export default FAIcon;
