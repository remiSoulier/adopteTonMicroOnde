import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
await db.exec(`create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table profiles(id uuid primary key,role smallint);
insert into profiles values('${uid(1)}',1),('${uid(2)}',2),('${uid(3)}',3);
create function public.get_my_role() returns smallint language sql security definer set search_path='' as $$ select role from public.profiles where id=auth.uid() $$;
create table microwaves(id uuid primary key,nom text);
create table reservations(id uuid primary key,microwave_id uuid references microwaves(id) on delete cascade,date date);
grant usage on schema auth,public to anon,authenticated;
grant all on microwaves to anon,authenticated;
create policy legacy_all on microwaves for all to anon,authenticated using(true) with check(true);
insert into microwaves values('${uid(10)}','Réservé');
insert into reservations values('${uid(20)}','${uid(10)}',(now() at time zone 'Europe/Paris')::date);
-- Simulate upgrading the former list function with its old return type.
create function admin_list_microwaves(p_offset integer default 0)
returns table(id uuid,nom text,has_reservations boolean) language sql as $$ select id,nom,true from microwaves $$;
`);
const migration=readFileSync(new URL('./microwave-admin.sql', import.meta.url),'utf8');
await db.exec(migration);await db.exec(migration);
assert.equal((await db.query(`select is_active from microwaves where id='${uid(10)}'`)).rows[0].is_active,true);
await db.exec('set role anon');
for (const sql of ['select * from admin_list_microwaves()', "select admin_save_microwave(null,'Non')", `select admin_delete_microwave('${uid(10)}')`, `select admin_set_microwave_active('${uid(10)}',false)`]) await assert.rejects(db.query(sql));
for(const role of [1,2,3]) {
 await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid(role)}',false)`);
 await assert.rejects(db.query(`insert into microwaves(id,nom) values('${uid(99)}','Intrusion')`));
 assert.equal((await db.query(`update microwaves set nom='Intrusion',is_active=false returning id`)).rows.length,0);
 assert.equal((await db.query('delete from microwaves returning id')).rows.length,0);
 if(role===1) {
  for (const sql of ['select * from admin_list_microwaves()', "select admin_save_microwave(null,'Non')", `select admin_delete_microwave('${uid(10)}')`, `select admin_set_microwave_active('${uid(10)}',false)`]) await assert.rejects(db.query(sql));
 } else {
  await assert.rejects(db.query("select admin_save_microwave(null,'   ')"));
  await assert.rejects(db.query("select admin_save_microwave(null,repeat('x',101))"));
  await assert.rejects(db.query('select * from admin_list_microwaves(-1)'));
  await db.query("select admin_save_microwave(null,'Cuisine')");
  const rows=(await db.query('select * from admin_list_microwaves()')).rows;
  const added=rows.find(r=>r.nom==='Cuisine');assert.ok(added);assert.equal(added.can_delete,true);assert.equal(added.is_active,true);
  assert.equal(rows.find(r=>r.id===uid(10)).can_delete,false);
  await db.query(`select admin_save_microwave('${added.id}','Cuisine 2')`);
  assert.ok((await db.query('select * from admin_list_microwaves()')).rows.some(r=>r.nom==='Cuisine 2'));
  await assert.rejects(db.query(`select admin_set_microwave_active('${added.id}',null)`));
  await db.query(`select admin_set_microwave_active('${added.id}',false)`);
  assert.equal((await db.query('select * from admin_list_microwaves()')).rows.find(r=>r.id===added.id).is_active,false);
  await db.query(`select admin_set_microwave_active('${added.id}',true)`);
  assert.equal((await db.query('select * from admin_list_microwaves()')).rows.find(r=>r.id===added.id).is_active,true);
  await assert.rejects(db.query(`select admin_delete_microwave('${uid(10)}')`));
  await db.query(`select admin_delete_microwave('${added.id}')`);
  assert.ok(!(await db.query('select * from admin_list_microwaves()')).rows.some(r=>r.id===added.id));
  await assert.rejects(db.query(`select admin_delete_microwave('${added.id}')`));
  await assert.rejects(db.query(`select admin_save_microwave('${added.id}','Disparu')`));
  await assert.rejects(db.query(`select admin_set_microwave_active('${added.id}',true)`));
 }
}
await db.exec('reset role');
// Date boundaries: future, today, yesterday, exactly two days, three days, unknown.
for (const [index, days] of [1,0,-1,-2,-3,null].entries()) {
 const id=uid(100+index),reservation=uid(200+index);
 await db.exec(`insert into microwaves(id,nom) values('${id}','Date ${index}'); insert into reservations values('${reservation}','${id}',${days===null ? 'null' : `(now() at time zone 'Europe/Paris')::date + (${days})`});`);
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid(2)}',false)`);
 const row=(await db.query('select * from admin_list_microwaves()')).rows.find(r=>r.id===id);
 assert.equal(row.can_delete,days===-3);
 if(days===-3) await db.query(`select admin_delete_microwave('${id}')`);
 else await assert.rejects(db.query(`select admin_delete_microwave('${id}')`));
 await db.exec('reset role');
 assert.equal((await db.query(`select * from reservations where id='${reservation}'`)).rows.length,1);
 if(days===-3) {
  const archived=(await db.query(`select * from microwaves where id='${id}'`)).rows[0];
  assert.ok(archived.deleted_at);assert.equal(archived.is_active,false);
  await assert.rejects(db.query(`insert into reservations values('${uid(300)}','${id}',current_date)`));
 }
}
// One old reservation cannot mask another recent reservation.
await db.exec(`insert into reservations values('${uid(301)}','${uid(10)}',current_date-10); set role authenticated;`);
await assert.rejects(db.query(`select admin_delete_microwave('${uid(10)}')`));
// Deactivation preserves current reservations but rejects new assignments, even as database owner.
await db.query(`select admin_set_microwave_active('${uid(10)}',false)`);
await db.exec('reset role');
assert.equal((await db.query(`select * from reservations where microwave_id='${uid(10)}'`)).rows.length,2);
await assert.rejects(db.query(`insert into reservations values('${uid(302)}','${uid(10)}',current_date)`));
await assert.rejects(db.query(`update reservations set microwave_id='${uid(10)}' where id='${uid(200)}'`));
await db.query(`update reservations set microwave_id=microwave_id where id='${uid(20)}'`);
await db.exec('set role authenticated');await db.query(`select admin_set_microwave_active('${uid(10)}',true)`);await db.exec('reset role');
await db.query(`insert into reservations values('${uid(302)}','${uid(10)}',current_date)`);
await db.exec(`insert into microwaves(id,nom) select gen_random_uuid(),'Pagination' from generate_series(1,55); set role authenticated;`);
assert.equal((await db.query('select * from admin_list_microwaves(0)')).rows.length,51);
assert.equal((await db.query('select * from admin_list_microwaves(50)')).rows.length,11);
console.log('Tests SQL réussis : migration, droits, activation/désactivation, dates limites, historique, attributions et pagination.');
await db.close();
