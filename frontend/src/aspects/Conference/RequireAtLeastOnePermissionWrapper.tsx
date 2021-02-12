import React from "react";
import type { Permission_Enum } from "../../generated/graphql";
import { useConferenceCurrentUserActivePermissions } from "./useConferenceCurrentUserActivePermissions";

export default function RequireAtLeastOnePermissionWrapper({
    children,
    permissions,
    componentIfDenied,
}: {
    children: string | JSX.Element | Array<JSX.Element | string>;
    permissions?: Array<Permission_Enum>;
    componentIfDenied?: JSX.Element;
}): JSX.Element | null {
    const activePermissions = useConferenceCurrentUserActivePermissions();

    if (!permissions || permissions.some((permission) => activePermissions.has(permission))) {
        return <>{children}</>;
    }

    return componentIfDenied ?? null;
}
