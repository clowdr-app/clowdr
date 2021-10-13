# System Configuration

The `system.Configuration` table is a key-value store for system configuration variables. The keys are strings and the values are arbitrary JSON blobs.

## Email templates

Handlebars HTML templates used to wrap all emails sent from the platform.

### Key

`EMAIL_TEMPLATES`

### Value

Map of email template configurations. See [emailTemplate.ts](/services/actions/src/lib/email/emailTemplate.ts) for the accepted context values.

The object has the following type:

```typescript
type EmailTemplates = {
  default?: {
    subject: string; // Handlebars template
    body: string; // Handlebars template
  };
};
```

### Example

```json
{
  "default": {
      "subject": "{{subject}}",
      "body": "<h1>{{subject}}</h1>\n{{{htmlBody}}}\n{{{unsubscribeDetails}}}"
}
```
