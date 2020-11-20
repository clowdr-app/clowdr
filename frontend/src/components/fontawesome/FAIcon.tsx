import {
    chakra,
    ChakraProps,
    forwardRef,
    SystemStyleObject,
} from "@chakra-ui/system";
import { cx, __DEV__ } from "@chakra-ui/utils";
import * as React from "react";

export interface IconProps extends ChakraProps, ChakraProps {
    iconStyle: "s" | "r";
    icon: string;
}

export const FAIcon = forwardRef<IconProps, "i">(function Icon(props, ref) {
    const {
        iconStyle,
        icon,
        as: element,
        color = "currentColor",
        className,
        __css,
        ...rest
    } = props;

    const _className = cx("chakra-icon", className);

    const styles: SystemStyleObject = {
        w: "1em",
        h: "1em",
        display: "inline-block",
        lineHeight: "1em",
        flexShrink: 0,
        color,
        marginRight: "0.5em",
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
    const iconEl = (
        <i className={`fa${iconStyle} fa-${icon}`} />
    ) as React.ReactNode;

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
