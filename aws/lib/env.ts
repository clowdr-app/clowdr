import assert from "assert";

export interface Env {
    DOTENV_CONFIG_PATH: string;
    STACK_PREFIX: string;

    DATADOG_AVAILABLE: boolean;
    GOOGLE_CLOUD_AVAILABLE: boolean;
    HASURA_CLOUD_AVAILABLE: boolean;
    HEROKU_AVAILABLE: boolean;
    NETLIFY_AVAILABLE: boolean;
    SENDGRID_AVAILABLE: boolean;

    AUTH0_LOGIN_TITLE: string;
    AUTH0_LOGIN_ENABLED_LOCALES: string[];
    AUTH0_PICTURE_URL: string;
    AUTH0_SUPPORT_EMAIL: string;
    AUTH0_SUPPORT_URL: string;
    AUTH0_ENABLE_CUSTOM_DOMAIN: boolean;
    AUTH0_SENDER_EMAIL: string;
    AUTH0_SENDER_NAME: string;
    AUTH0_CUSTOM_DOMAIN?: string;

    FRONTEND_HOSTS: string[];

    GRAPHQL_API_SECURE_PROTOCOLS: string;
    GRAPHQL_API_DOMAIN: string;

    FAILURE_NOTIFICATIONS_EMAIL_ADDRESS: string | null;

    ACTIONS_HOST_SECURE_PROTOCOLS: boolean;
    ACTIONS_HOST_DOMAIN: string;
    ACTIONS_CORS_ORIGIN: string;

    AUTH_HOST_SECURE_PROTOCOLS: boolean;
    AUTH_HOST_DOMAIN: string;
    AUTH_CORS_ORIGIN: string;

    CACHES_HOST_SECURE_PROTOCOLS: boolean;
    CACHES_HOST_DOMAIN: string;
    CACHES_CORS_ORIGIN: string;

    PLAYOUT_HOST_SECURE_PROTOCOLS: boolean;
    PLAYOUT_HOST_DOMAIN: string;
    PLAYOUT_CORS_ORIGIN: string;

    REALTIME_HOST_SECURE_PROTOCOLS: boolean;
    REALTIME_HOST_DOMAIN: string;
    REALTIME_CORS_ORIGIN: string;

    DDPROXY_HOST_SECURE_PROTOCOLS: boolean;
    DDPROXY_HOST_DOMAIN: string;
    DDPROXY_CORS_ORIGIN: string;
}

const DOTENV_CONFIG_PATH = process.env.DOTENV_CONFIG_PATH;
assert(DOTENV_CONFIG_PATH, "Must specify DOTENV_CONFIG_PATH");

const STACK_PREFIX = process.env.STACK_PREFIX ?? "dev";

const DATADOG_AVAILABLE = process.env.DATADOG_AVAILABLE === "true";
const GOOGLE_CLOUD_AVAILABLE = process.env.GOOGLE_CLOUD_AVAILABLE === "true";
const HASURA_CLOUD_AVAILABLE = process.env.HASURA_CLOUD_AVAILABLE === "true";
const HEROKU_AVAILABLE = process.env.HEROKU_AVAILABLE === "true";
const NETLIFY_AVAILABLE = process.env.NETLIFY_AVAILABLE === "true";
const SENDGRID_AVAILABLE = process.env.SENDGRID_AVAILABLE === "true";

const AUTH0_LOGIN_TITLE = process.env.AUTH0_LOGIN_TITLE ?? "Midspace Developer System";
const AUTH0_LOGIN_ENABLED_LOCALES = process.env.AUTH0_LOGIN_ENABLED_LOCALES
    ? process.env.AUTH0_LOGIN_ENABLED_LOCALES.split(",")
    : ["en"];
const AUTH0_PICTURE_URL =
    process.env.AUTH0_PICTURE_URL ??
    "https://images.squarespace-cdn.com/content/v1/609d52f518379f382edb3b2e/452da127-ce9f-4e6f-bcc0-f8e8b9715c8c/Midspace-formerly-Clowdr-Purple.png?format=1000w";
const AUTH0_SUPPORT_EMAIL = process.env.AUTH0_SUPPORT_EMAIL ?? "support+developer-error@midspace.app";
const AUTH0_SUPPORT_URL = process.env.AUTH0_SUPPORT_URL ?? "https://support.midspace.app";
const AUTH0_ENABLE_CUSTOM_DOMAIN = process.env.AUTH0_ENABLE_CUSTOM_DOMAIN === "true";
const AUTH0_SENDER_EMAIL = process.env.AUTH0_SENDER_EMAIL ?? "external-developer@midspace.app";
const AUTH0_SENDER_NAME = process.env.AUTH0_SENDER_NAME ?? "Midspace Developer System";
const AUTH0_CUSTOM_DOMAIN = process.env.AUTH0_CUSTOM_DOMAIN;

const FRONTEND_HOSTS = process.env.FRONTEND_HOSTS ? process.env.FRONTEND_HOSTS.split(",") : ["http://localhost:3000"];

const GRAPHQL_API_SECURE_PROTOCOLS = process.env.GRAPHQL_API_SECURE_PROTOCOLS ?? "false";
const GRAPHQL_API_DOMAIN = process.env.GRAPHQL_API_DOMAIN ?? "localhost:8080";

const FAILURE_NOTIFICATIONS_EMAIL_ADDRESS = process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS ?? null;

const baseCORSOrigin = process.env.CORS_ORIGIN ?? FRONTEND_HOSTS.join(",");
const baseDomainPrefix = process.env.SERVICE_HOSTS_DOMAIN_PREFIX;
const baseDomainSuffix = process.env.SERVICE_HOSTS_DOMAIN_SUFFIX;
const baseDomain_Actions =
    baseDomainPrefix && baseDomainSuffix ? `${baseDomainPrefix}actions${baseDomainSuffix}` : undefined;
const baseDomain_Auth = baseDomainPrefix && baseDomainSuffix ? `${baseDomainPrefix}auth${baseDomainSuffix}` : undefined;
const baseDomain_Caches =
    baseDomainPrefix && baseDomainSuffix ? `${baseDomainPrefix}caches${baseDomainSuffix}` : undefined;
const baseDomain_Playout =
    baseDomainPrefix && baseDomainSuffix ? `${baseDomainPrefix}playout${baseDomainSuffix}` : undefined;
const baseDomain_Realtime =
    baseDomainPrefix && baseDomainSuffix ? `${baseDomainPrefix}realtime${baseDomainSuffix}` : undefined;
const baseDomain_DataDogProxy =
    baseDomainPrefix && baseDomainSuffix ? `${baseDomainPrefix}datadog${baseDomainSuffix}` : undefined;
const baseHostSecureProtocols = process.env.SERVICE_HOSTS_SECURE_PROTOCOLS !== "false";

const ACTIONS_CORS_ORIGIN = process.env.ACTIONS_CORS_ORIGIN ?? baseCORSOrigin;
const ACTIONS_HOST_SECURE_PROTOCOLS =
    process.env.ACTIONS_HOST_SECURE_PROTOCOLS !== undefined
        ? process.env.ACTIONS_HOST_SECURE_PROTOCOLS === "true"
        : baseHostSecureProtocols;
const ACTIONS_HOST_DOMAIN = process.env.ACTIONS_HOST_DOMAIN ?? baseDomain_Actions;
assert(ACTIONS_HOST_DOMAIN, "Must specify ACTIONS_HOST_DOMAIN");

const AUTH_CORS_ORIGIN = process.env.AUTH_CORS_ORIGIN ?? baseCORSOrigin;
const AUTH_HOST_SECURE_PROTOCOLS =
    process.env.AUTH_HOST_SECURE_PROTOCOLS !== undefined
        ? process.env.AUTH_HOST_SECURE_PROTOCOLS === "true"
        : baseHostSecureProtocols;
const AUTH_HOST_DOMAIN = process.env.AUTH_HOST_DOMAIN ?? baseDomain_Auth;
assert(AUTH_HOST_DOMAIN, "Must specify AUTH_HOST_DOMAIN");

const CACHES_CORS_ORIGIN = process.env.CACHES_CORS_ORIGIN ?? baseCORSOrigin;
const CACHES_HOST_SECURE_PROTOCOLS =
    process.env.CACHES_HOST_SECURE_PROTOCOLS !== undefined
        ? process.env.CACHES_HOST_SECURE_PROTOCOLS === "true"
        : baseHostSecureProtocols;
const CACHES_HOST_DOMAIN = process.env.CACHES_HOST_DOMAIN ?? baseDomain_Caches;
assert(CACHES_HOST_DOMAIN, "Must specify CACHES_HOST_DOMAIN");

const PLAYOUT_CORS_ORIGIN = process.env.PLAYOUT_CORS_ORIGIN ?? baseCORSOrigin;
const PLAYOUT_HOST_SECURE_PROTOCOLS =
    process.env.PLAYOUT_HOST_SECURE_PROTOCOLS !== undefined
        ? process.env.PLAYOUT_HOST_SECURE_PROTOCOLS === "true"
        : baseHostSecureProtocols;
const PLAYOUT_HOST_DOMAIN = process.env.PLAYOUT_HOST_DOMAIN ?? baseDomain_Playout;
assert(PLAYOUT_HOST_DOMAIN, "Must specify PLAYOUT_HOST_DOMAIN");

const REALTIME_CORS_ORIGIN = process.env.REALTIME_CORS_ORIGIN ?? baseCORSOrigin;
const REALTIME_HOST_SECURE_PROTOCOLS =
    process.env.REALTIME_HOST_SECURE_PROTOCOLS !== undefined
        ? process.env.REALTIME_HOST_SECURE_PROTOCOLS === "true"
        : baseHostSecureProtocols;
const REALTIME_HOST_DOMAIN = process.env.REALTIME_HOST_DOMAIN ?? baseDomain_Realtime;
assert(REALTIME_HOST_DOMAIN, "Must specify REALTIME_HOST_DOMAIN");

const DDPROXY_CORS_ORIGIN = process.env.DDPROXY_CORS_ORIGIN ?? baseCORSOrigin;
const DDPROXY_HOST_SECURE_PROTOCOLS =
    process.env.DDPROXY_HOST_SECURE_PROTOCOLS !== undefined
        ? process.env.DDPROXY_HOST_SECURE_PROTOCOLS === "true"
        : baseHostSecureProtocols;
const DDPROXY_HOST_DOMAIN = process.env.DDPROXY_HOST_DOMAIN ?? baseDomain_DataDogProxy;
assert(DDPROXY_HOST_DOMAIN, "Must specify DDPROXY_HOST_DOMAIN");

// const REALTIME_REDIS_KEY = process.env.REALTIME_REDIS_KEY ?? "socket.io";

export const env: Env = {
    DOTENV_CONFIG_PATH,
    STACK_PREFIX,

    DATADOG_AVAILABLE,
    GOOGLE_CLOUD_AVAILABLE,
    HASURA_CLOUD_AVAILABLE,
    HEROKU_AVAILABLE,
    NETLIFY_AVAILABLE,
    SENDGRID_AVAILABLE,

    AUTH0_LOGIN_TITLE,
    AUTH0_LOGIN_ENABLED_LOCALES,
    AUTH0_PICTURE_URL,
    AUTH0_SUPPORT_EMAIL,
    AUTH0_SUPPORT_URL,
    AUTH0_ENABLE_CUSTOM_DOMAIN,
    AUTH0_SENDER_EMAIL,
    AUTH0_SENDER_NAME,
    AUTH0_CUSTOM_DOMAIN,

    FRONTEND_HOSTS,

    ACTIONS_HOST_SECURE_PROTOCOLS,
    ACTIONS_HOST_DOMAIN,
    ACTIONS_CORS_ORIGIN,

    AUTH_HOST_SECURE_PROTOCOLS,
    AUTH_HOST_DOMAIN,
    AUTH_CORS_ORIGIN,

    CACHES_HOST_SECURE_PROTOCOLS,
    CACHES_HOST_DOMAIN,
    CACHES_CORS_ORIGIN,

    PLAYOUT_HOST_SECURE_PROTOCOLS,
    PLAYOUT_HOST_DOMAIN,
    PLAYOUT_CORS_ORIGIN,

    REALTIME_HOST_SECURE_PROTOCOLS,
    REALTIME_HOST_DOMAIN,
    REALTIME_CORS_ORIGIN,

    DDPROXY_HOST_SECURE_PROTOCOLS,
    DDPROXY_HOST_DOMAIN,
    DDPROXY_CORS_ORIGIN,

    GRAPHQL_API_SECURE_PROTOCOLS,
    GRAPHQL_API_DOMAIN,

    FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
};
