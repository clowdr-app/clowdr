CREATE OR REPLACE VIEW public."ForeignKeyIntrospection"
AS select
    con.constraint_name,
    ns.nspname as "parent_schema", 
    cl.relname as "parent_table", 
    att.attname as "parent_column",
    con.child_schema,
    con.child_table,
    att2.attname as "child_column"
from
   (select 
        unnest(con1.conkey) as "parent", 
        unnest(con1.confkey) as "child", 
        con1.conname as constraint_name,
        con1.confrelid, 
        con1.conrelid,
        cl.relname as child_table,
        ns.nspname as child_schema
    from 
        pg_class cl
        join pg_namespace ns on cl.relnamespace = ns.oid
        join pg_constraint con1 on con1.conrelid = cl.oid
    where  con1.contype = 'f'
   ) con
   join pg_attribute att on
       att.attrelid = con.confrelid and att.attnum = con.child
   join pg_class cl on
       cl.oid = con.confrelid
   join pg_namespace ns on 
       cl.relnamespace = ns.oid
   join pg_attribute att2 on
       att2.attrelid = con.conrelid and att2.attnum = con.parent
   where NOT (cl.relname like 'hdb_%')
order by parent_schema, parent_table, child_schema, child_table, constraint_name;
