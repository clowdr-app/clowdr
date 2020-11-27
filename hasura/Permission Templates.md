# Hasura Permission Templates

Use these as templates for configuring Hasura row-select permissions (to be applied carefully and adapated appropriately).

- Active attendee matching session user:

  `{"conference":{"attendees":{"_and":[{"userId":{"_eq":"X-Hasura-User-Id"}},{"statusName":{"_eq":"ACTIVE"}}]}}}`

- Active attendee matching session user belonging to a group with the specified permission (e.g. `CONFERENCE_MANAGE_ROLES`):

  `{"conference":{"activeGroups":{"_and":[{"groupAttendees":{"attendee":{"_and":[{"userId":{"_eq":"X-Hasura-User-Id"}},{"statusName":{"_eq":"ACTIVE"}}]}}},{"groupRoles":{"role":{"rolePermissions":{"permissionName":{"_eq":"CONFERENCE_MANAGE_ROLES"}}}}}]}}}`

- Active attendee matching session user belonging to a group with one of several specified permissions (e.g. `CONFERENCE_MANAGE_ROLES` and/or `CONFERENCE_MANAGE_GROUPS`):

  `{"conference":{"activeGroups":{"_and":[{"groupAttendees":{"attendee":{"_and":[{"userId":{"_eq":"X-Hasura-User-Id"}},{"statusName":{"_eq":"ACTIVE"}}]}}},{"groupRoles":{"role":{"rolePermissions":{"_or":[{"permissionName":{"_eq":"CONFERENCE_MANAGE_ROLES"}},{"permissionName":{"_eq":"CONFERENCE_MANAGE_GROUPS"}}]}}}}]}}}`

- Active attendee matching session user and user is either the conference creator or belongs to a group with the specified permission (e.g. `CONFERENCE_MANAGE_ROLES`):

  `{"conference":{"_or":[{"createdBy":{"_eq":"X-Hasura-User-Id"}},{"activeGroups":{"_and":[{"groupAttendees":{"attendee":{"_and":[{"userId":{"_eq":"X-Hasura-User-Id"}},{"statusName":{"_eq":"ACTIVE"}}]}}},{"groupRoles":{"role":{"rolePermissions":{"permissionName":{"_eq":"CONFERENCE_MANAGE_ROLES"}}}}}]}}]}}`

- Active attendee matching session user and user is either the conference creator or belongs to a group with one of several specified permissions (e.g. `CONFERENCE_MANAGE_ROLES` and/or `CONFERENCE_MANAGE_GROUPS`):

  `{"conference":{"_or":[{"createdBy":{"_eq":"X-Hasura-User-Id"}},{"activeGroups":{"_and":[{"groupAttendees":{"attendee":{"_and":[{"userId":{"_eq":"X-Hasura-User-Id"}},{"statusName":{"_eq":"ACTIVE"}}]}}},{"groupRoles":{"role":{"rolePermissions":{"_or":[{"permissionName":{"_eq":"CONFERENCE_MANAGE_ROLES"}},{"permissionName":{"_eq":"CONFERENCE_MANAGE_GROUPS"}}]}}}}]}}]}}`

- Active attendee matching session user belonging to a group with the specified permission (e.g. `CONFERENCE_VIEW`)
  OR there exists a group with unauthenticatedAccess allowed with the specified permission (e.g. `CONFERENCE_VIEW`):

  `{"_or":[{"createdBy":{"_eq":"X-Hasura-User-Id"}},{"activeGroups":{"_and":[{"_or":[{"includeUnauthenticated":{"_eq":true}},{"groupAttendees":{"attendee":{"_and":[{"userId":{"_eq":"X-Hasura-User-Id"}},{"statusName":{"_eq":"ACTIVE"}}]}}}]},{"groupRoles":{"role":{"rolePermissions":{"permissionName":{"_eq":"CONFERENCE_VIEW"}}}}}]}}]}`
