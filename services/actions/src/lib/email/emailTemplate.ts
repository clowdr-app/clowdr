import { gql } from "@apollo/client/core";
import { compile } from "handlebars";
import type { P } from "pino";
import { is } from "typescript-is";
import { GetEmailTemplatesDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { fallbackTemplates } from "./fallbackTemplates";

gql`
    query GetEmailTemplates {
        emailTemplates: system_Configuration_by_pk(key: EMAIL_TEMPLATES) {
            key
            value
        }
    }
`;

export interface EmailTemplateContext {
    frontendHost: string;
    hostOrganisationName: string;
    htmlBody: string;
    htmlUnsubscribeDetails: string;
    sendingReason: string;
    stopEmailsAddress: string;
    subject: string;
    supportAddress: string;
    techSupportAddress: string;
}

interface EmailTemplates {
    default?: EmailTemplate;
}

interface EmailTemplate {
    subject: string;
    body: string;
}

export async function getEmailTemplate(logger: P.Logger): Promise<EmailTemplate> {
    const result = await apolloClient.query({
        query: GetEmailTemplatesDocument,
    });

    if (result.data.emailTemplates?.value) {
        if (is<EmailTemplates>(result.data.emailTemplates.value)) {
            if (result.data.emailTemplates.value.default) {
                return result.data.emailTemplates.value.default;
            }
        } else {
            logger.warn("Invalid default email template in configuration");
        }
    }
    return fallbackTemplates;
}

export class EmailBuilder {
    private subjectTemplate = compile<EmailTemplateContext>(this.template.subject);
    private bodyTemplate = compile<EmailTemplateContext>(this.template.body);

    constructor(private template: EmailTemplate) {}

    compile(context: EmailTemplateContext): EmailTemplate {
        return {
            subject: this.subjectTemplate(context),
            body: this.bodyTemplate(context),
        };
    }
}
