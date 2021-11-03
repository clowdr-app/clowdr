import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

if (import.meta.env.SNOWPACK_PUBLIC_DD_CLIENT_TOKEN && import.meta.env.SNOWPACK_PUBLIC_DD_SITE) {
    console.log("Initialising DataDog for monitoring user experience and debugging.");

    datadogLogs.init({
        clientToken: import.meta.env.SNOWPACK_PUBLIC_DD_CLIENT_TOKEN,
        site: import.meta.env.SNOWPACK_PUBLIC_DD_SITE,
        env: import.meta.env.SNOWPACK_PUBLIC_DD_ENV ?? "production",
        service: "midspace-frontend",
        version: import.meta.env.SNOWPACK_PUBLIC_DD_FRONTEND_VERSION ?? "v1.0.0",
        forwardErrorsToLogs: true,
        sampleRate: 100,
        useSecureSessionCookie: true,
        useCrossSiteSessionCookie: true,
        proxyUrl: import.meta.env.SNOWPACK_PUBLIC_DD_PROXY_URL,
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
            if (event.message.includes("Initial chat data")) {
                event.message = "Initial chat data";
            }
            return true;
        },
    });

    datadogRum.init({
        applicationId: import.meta.env.SNOWPACK_PUBLIC_DD_APPLICATION_ID,
        clientToken: import.meta.env.SNOWPACK_PUBLIC_DD_CLIENT_TOKEN,
        env: import.meta.env.SNOWPACK_PUBLIC_DD_ENV ?? "production",
        site: import.meta.env.SNOWPACK_PUBLIC_DD_SITE,
        service: "midspace-frontend",
        version: import.meta.env.SNOWPACK_PUBLIC_DD_FRONTEND_VERSION ?? "v1.0.0",
        proxyUrl: import.meta.env.SNOWPACK_PUBLIC_DD_PROXY_URL,
        sampleRate: 100,
        trackInteractions: true,
        defaultPrivacyLevel: "mask-user-input",
        useSecureSessionCookie: true,
        useCrossSiteSessionCookie: true,
    });

    datadogRum.startSessionReplayRecording();
}
