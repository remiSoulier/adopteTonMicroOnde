import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create table public.profiles(id uuid primary key, pseudo text not null, avatar_url text);
insert into public.profiles(id,pseudo) values ('${uid(1)}','user'),('${uid(2)}','admin'),('${uid(3)}','superadmin'),('${uid(4)}','second superadmin');
grant all on public.profiles to anon, authenticated;
create policy legacy_permissive on public.profiles for all to anon, authenticated using(true) with check(true);
`);
const migration = readFileSync(new URL('./roles.sql', import.meta.url), 'utf8');
await db.exec(migration);
await db.exec(migration); // Repeatable installation.
await db.exec(`update profiles set role=2 where id='${uid(2)}'; update profiles set role=3 where id in ('${uid(3)}','${uid(4)}');`);
let checks = 0;
async function asUser(n, callback) {
 await db.exec(`set role ${n === null ? 'anon' : 'authenticated'}; select set_config('request.jwt.claim.sub','${n === null ? '' : uid(n)}',false);`);
 try { await callback(); } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub','',false);"); }
}
async function denied(sql) { await assert.rejects(db.exec(sql)); checks++; }
await asUser(null, async () => {
 await denied('select public.get_my_role()');
 await denied('select * from public.list_user_roles(0)');
 await denied(`select public.set_user_role('${uid(1)}',3::smallint)`);
});
await asUser(1, async () => {
 assert.equal((await db.query('select public.get_my_role() as role')).rows[0].role,1); checks++;
 await denied('select * from public.list_user_roles(0)');
 await denied(`select public.set_user_role('${uid(1)}',3::smallint)`);
 await denied(`update profiles set role=3 where id='${uid(1)}'`);
 await denied(`update profiles set id='${uid(9)}' where id='${uid(1)}'`);
 await db.exec(`insert into profiles(id,pseudo,role) values ('${uid(5)}','spoof',3)`);
 assert.equal((await db.query(`select role from profiles where id='${uid(5)}'`)).rows[0].role,1); checks++;
 await denied(`delete from profiles where id='${uid(3)}'`);
});
await asUser(2, async () => {
 assert.equal((await db.query('select * from public.list_user_roles(0)')).rows.length,5); checks++;
 await denied(`select public.set_user_role('${uid(1)}',2::smallint)`);
});
await asUser(3, async () => {
 await db.exec(`select public.set_user_role('${uid(1)}',2::smallint)`);
 assert.equal((await db.query(`select role from profiles where id='${uid(1)}'`)).rows[0].role,2); checks++;
 await denied(`select public.set_user_role('${uid(3)}',1::smallint)`);
 await denied(`select public.set_user_role('${uid(1)}',4::smallint)`);
 await denied(`select public.set_user_role('${uid(99)}',1::smallint)`);
 await db.exec(`select public.set_user_role('${uid(4)}',1::smallint)`);
});
await asUser(4, async () => {
 await denied(`select public.set_user_role('${uid(3)}',1::smallint)`);
});
await asUser(99, async () => { await denied('select * from public.list_user_roles(0)'); });
await db.close();
console.log(`${checks} authorization checks passed; migration can be rerun.`);
