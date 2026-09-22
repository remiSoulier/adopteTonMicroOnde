import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
await db.exec(`create role anon;create role authenticated;create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function get_my_role() returns smallint language sql stable as $$ select case when auth.uid()='${id(3)}' then 3 when auth.uid()='${id(2)}' then 2 else 1 end::smallint $$;
create table reservations(id uuid primary key,date date);
insert into reservations values('${id(10)}','2020-01-02'),('${id(11)}','2020-01-02'),('${id(12)}','2999-01-02');`);
const sql=readFileSync(new URL('./delete-attribution.sql',import.meta.url),'utf8');
await db.exec(sql);await db.exec(sql);
await db.exec('set role anon');
await assert.rejects(db.query(`select superadmin_delete_attribution('${id(10)}','2020-01-01')`));
await db.exec('reset role;set role authenticated');
for(const user of [1,2]) {
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id(user)]);
 await assert.rejects(db.query(`select superadmin_delete_attribution('${id(10)}','2020-01-01')`));
}
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id(3)]);
await assert.rejects(db.query(`select superadmin_delete_attribution('${id(12)}','2999-01-01')`));
assert.equal((await db.query(`select superadmin_delete_attribution('${id(10)}','2020-01-03') as removed`)).rows[0].removed,false);
assert.equal((await db.query(`select superadmin_delete_attribution('${id(10)}','2020-01-01') as removed`)).rows[0].removed,true);
assert.equal((await db.query(`select superadmin_delete_attribution('${id(10)}','2020-01-01') as removed`)).rows[0].removed,false);
await db.exec('reset role');assert.equal((await db.query('select * from reservations')).rows.length,2);
console.log('PASS: anon/user/admin denied; superadmin allowed; wrong day and open vote protected; retry safe; other reservations preserved.');
await db.close();
