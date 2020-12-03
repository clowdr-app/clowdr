# Hasura Permission Templates

Use these as templates for configuring Hasura row-select permissions (to be applied carefully and adapated appropriately).

Partial template so far (created for `Group:user:select` permission):

```json
{"_or":[{"_and":[{"enabled":{"_eq":true}},{"_or":[{"includeUnauthenticated":{"_eq":true}},{"groupAttendees":{"attendee":{"userId":{"_eq":"X-Hasura-User-Id"}}}}]}]},{"conference":{"_or":[{"createdBy":{"_eq":"X-Hasura-User-Id"}},{"groups":{"_and":[{"enabled":{"_eq":true}},{"groupRoles":{"role":{"rolePermissions":{"_or":[{"permissionName":{"_eq":"CONFERENCE_MANAGE_ROLES"}},{"permissionName":{"_eq":"CONFERENCE_MANAGE_GROUPS"}}]}}}},{"groupAttendees":{"attendee":{"userId":{"_eq":"X-Hasura-User-Id"}}}}]}}]}}]}
```



WIP for Attendee select:
```
{"_or":[{"_and":[{"userId":{"_is_null":false}},{"conference":{"groups":{"_and":[{"enabled":{"_eq":true}},{"groupRoles":{"role":{"rolePermissions":{"_or":[{"permissionName":{"_eq":"CONFERENCE_VIEW_ATTENDEES"}},{"permissionName":{"_eq":"CONFERENCE_MANAGE_ATTENDEES"}},{"permissionName":{"_eq":"CONFERENCE_MANAGE_GROUPS"}},{"permissionName":{"_eq":"CONFERENCE_MANAGE_ROLES"}}]}}}},{"_or":[{"includeUnauthenticated":{"_eq":true}},{"groupAttendees":{"attendee":{"userId":{"_eq":"X-Hasura-User-Id"}}}}]}]}}}]}]}
```
