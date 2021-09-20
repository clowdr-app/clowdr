import * as R from "ramda";
import React, { useMemo } from "react";

interface DeveloperSettings {
    /** Allow creation of ongoing events in the UI. */
    allowOngoingEventCreation: boolean;
}

const defaultDeveloperSettings: DeveloperSettings = {
    allowOngoingEventCreation: false,
};

interface AppSettings {
    developer: DeveloperSettings;
}

const defaultAppSettings: AppSettings = {
    developer: defaultDeveloperSettings,
};

const AppSettingsContext = React.createContext<AppSettings | undefined>(undefined);

export function useAppSettings(): AppSettings {
    const ctx = React.useContext(AppSettingsContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function AppSettingsProvider({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const appSettings = useMemo(() => {
        const defaultSettings = R.clone(defaultAppSettings);
        defaultSettings.developer.allowOngoingEventCreation =
            import.meta.env.SNOWPACK_PUBLIC_DEVELOPER_ALLOW_ONGOING_EVENT_CREATION === "true";
        return defaultSettings;
    }, []);

    return <AppSettingsContext.Provider value={appSettings}>{children}</AppSettingsContext.Provider>;
}
