CREATE INDEX FlatUserPermission_index_userid_slug on "mat_FlatUserPermission" (user_id, slug);
CREATE INDEX FlatUnauthPermission_index_slug on "mat_FlatUnauthPermission" (slug);

CREATE INDEX FlatUserPermission_index_userid on "mat_FlatUserPermission" (user_id);
