import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import assert from "assert";
import { ManagementClient } from "auth0";
import type {
    CdkCustomResourceEvent,
    CloudFormationCustomResourceCreateEvent,
    CloudFormationCustomResourceDeleteEvent,
    CloudFormationCustomResourceUpdateEvent,
    Context,
} from "aws-lambda";

export async function onEvent(event: CdkCustomResourceEvent, context: Context) {
    switch (event.RequestType) {
        case "Create":
            return onCreate(event, context);
        case "Update":
            return onUpdate(event, context);
        case "Delete":
            return onDelete(event, context);
    }
}

function createProps(
    Name: string,
    EnabledLocales: string[],
    PictureURL: string,
    SupportEmail: string,
    SupportURL: string,
    UniversalLoginTheme: {
        colors: {
            page_background: string;
            primary: string;
        };
    },
    EnableCustomDomain: boolean
) {
    return {
        enabled_locales: EnabledLocales,
        flags: {
            enable_custom_domain_in_emails: EnableCustomDomain,
            enable_public_signup_user_exists_error: true,
            new_universal_login_experience_enabled: true,
            universal_login: true,
            disable_clickjack_protection_headers: false,
        },
        friendly_name: Name,
        picture_url: PictureURL,
        support_email: SupportEmail,
        support_url: SupportURL,
        universal_login: UniversalLoginTheme,
    };
}

async function update(event: CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent) {
    const AccountCredentialsARN = event.ResourceProperties.AccountCredentialsARN;

    const Name: string | undefined = event.ResourceProperties.Name;
    const EnabledLocales: string[] | undefined = event.ResourceProperties.EnabledLocales;
    const PictureURL: string | undefined = event.ResourceProperties.PictureURL;
    const SupportEmail: string | undefined = event.ResourceProperties.SupportEmail;
    const SupportURL: string | undefined = event.ResourceProperties.SupportURL;
    const UniversalLoginTheme: any | undefined = event.ResourceProperties.UniversalLoginTheme;
    const EnableCustomDomain: boolean | undefined =
        event.ResourceProperties.EnableCustomDomain === true || event.ResourceProperties.EnableCustomDomain === "true";

    assert(AccountCredentialsARN, "Account Credentials ARN property missing");
    assert(Name, "Name property missing");
    assert(EnabledLocales, "Enabled Locales property missing");
    assert(PictureURL, "Picture URL property missing");
    assert(SupportEmail, "Support Email property missing");
    assert(SupportURL, "Support URL property missing");
    assert(UniversalLoginTheme, "Universal Login Theme property missing");
    assert(EnableCustomDomain !== undefined, "Enable Custom Domain property missing");

    const sm = new SecretsManager({});
    const accountCredentialsSecret = await sm.getSecretValue({
        SecretId: AccountCredentialsARN,
    });
    assert(accountCredentialsSecret.SecretString, "Account credentials secret string missing.");
    const accountCredentials = JSON.parse(accountCredentialsSecret.SecretString);

    const auth0 = new ManagementClient({
        domain: accountCredentials.Domain,
        clientId: accountCredentials.ClientID,
        clientSecret: accountCredentials.ClientSecret,
    });
    const props = createProps(
        Name,
        EnabledLocales,
        PictureURL,
        SupportEmail,
        SupportURL,
        UniversalLoginTheme,
        EnableCustomDomain
    );
    await auth0.updateTenantSettings(props);

    return {
        PhysicalResourceId: accountCredentials.ClientID,
        Data: {},
    };
}

async function onCreate(event: CloudFormationCustomResourceCreateEvent, _context: Context) {
    return update(event);
}

async function onUpdate(event: CloudFormationCustomResourceUpdateEvent, _context: Context) {
    return update(event);
}

async function onDelete(_event: CloudFormationCustomResourceDeleteEvent, _context: Context) {
    // Nothing to do - we can't (and don't want to) delete the account
    return;
}
