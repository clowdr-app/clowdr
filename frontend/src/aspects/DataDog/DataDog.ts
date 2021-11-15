import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

if (
    typeof import.meta.env.VITE_DD_CLIENT_TOKEN === "string" &&
    typeof import.meta.env.VITE_DD_SITE === "string" &&
    typeof import.meta.env.VITE_DD_APPLICATION_ID == "string"
) {
    console.log("Initialising DataDog for monitoring user experience and debugging.");

    datadogLogs.init({
        clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
        site: import.meta.env.VITE_DD_SITE,
        env: (import.meta.env.VITE_DD_ENV as string | undefined) ?? "production",
        service: "midspace-frontend",
        version: (import.meta.env.VITE_DD_FRONTEND_VERSION as string | undefined) ?? "v1.0.0",
        forwardErrorsToLogs: true,
        sampleRate: 100,
        useSecureSessionCookie: true,
        useCrossSiteSessionCookie: true,
        proxyUrl: import.meta.env.VITE_DD_PROXY_URL as string | undefined,
        beforeSend: (event) => {
            if (event.message.includes("Warning: fragment with name")) {
                return false;
            }
            if (event.message.includes("Push notifications:")) {
                return false;
            }
            if (event.message.includes("Download the Apollo DevTools for a better development experience")) {
                return false;
            }
            if (event.message.includes("ResizeObserver loop limit exceeded")) {
                return false;
            }
            if (event.message.includes("The user aborted a request")) {
                return false;
            }
            if (event.message.includes("Initial chat data")) {
                event.message = "Initial chat data";
            }
            return true;
        },
    });

    datadogRum.init({
        applicationId: import.meta.env.VITE_DD_APPLICATION_ID,
        clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
        env: (import.meta.env.VITE_DD_ENV as string | undefined) ?? "production",
        site: import.meta.env.VITE_DD_SITE,
        service: "midspace-frontend",
        version: (import.meta.env.VITE_DD_FRONTEND_VERSION as string | undefined) ?? "v1.0.0",
        proxyUrl: import.meta.env.VITE_DD_PROXY_URL as string | undefined,
        sampleRate: 100,
        trackInteractions: true,
        defaultPrivacyLevel: "mask-user-input",
        useSecureSessionCookie: true,
        useCrossSiteSessionCookie: true,
    });

    datadogRum.startSessionReplayRecording();
}
