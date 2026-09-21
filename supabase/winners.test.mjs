import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
await db.exec(`
create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table profiles(id uuid primary key,pseudo text);
create table photos(id uuid primary key,user_id uuid,url text,legende text,created_at timestamptz);
create table microwaves(id uuid primary key,nom text);
create table reservations(id uuid primary key,user_id uuid,microwave_id uuid,date date);
insert into profiles values('${uid(1)}','Alice'),('${uid(2)}','Bob');
insert into microwaves values('${uid(1)}','Micro A'),('${uid(2)}','Micro B');
insert into photos values
('${uid(1)}','${uid(1)}','https://example.com/1','Photo 1','2020-03-27T10:00:00Z'),
('${uid(2)}','${uid(2)}','https://example.com/2','Photo 2','2020-03-27T10:00:00Z'),
('${uid(3)}','${uid(2)}','https://example.com/3','Photo 3','2020-03-27T11:00:00Z'),
('${uid(4)}','${uid(1)}','https://example.com/4','Photo 4','2020-03-28T09:00:00Z'),
('${uid(5)}','${uid(1)}','https://example.com/5','Photo future','2999-01-01T10:00:00Z');
insert into reservations values
('${uid(1)}','${uid(1)}','${uid(1)}','2020-03-29'),
('${uid(2)}','${uid(2)}','${uid(2)}','2020-03-29'),
('${uid(3)}','${uid(1)}','${uid(1)}','2999-01-03');
`);
const sql = readFileSync(new URL('./winners.sql',import.meta.url),'utf8');
await db.exec(sql); await db.exec(sql);
await db.exec('set role anon');
await assert.rejects(db.query('select * from list_closed_elections()'));
await assert.rejects(db.query("select * from get_election_winners('2020-03-28')"));
await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid(1)}',false)`);
let {rows: days} = await db.query('select * from list_closed_elections()');
assert.equal(days.length,2);
assert.equal(new Date(days[1].day).toISOString().slice(0,10),'2020-03-28');
assert.equal(new Date(days[1].voting_end).toISOString(),'2020-03-29T08:00:00.000Z');
assert.equal(Number(days[1].photo_count),3);
assert.equal((await db.query('select * from list_closed_elections(1)')).rows.length,1);
let {rows: winners} = await db.query("select * from get_election_winners('2020-03-28')");
assert.equal(winners.length,2);
assert.equal(winners[0].pseudo,'Alice');
assert.equal(winners[0].microwave_name,'Micro A');
assert.equal(winners[0].photo_url,'https://example.com/1');
assert.equal(winners[1].photo_url,null);
assert.equal((await db.query("select * from get_election_winners('2020-03-29')")).rows.length,0);
await assert.rejects(db.query("select * from get_election_winners('2999-01-02')"));
await db.exec("select set_config('request.jwt.claim.sub','',false)");
await assert.rejects(db.query('select * from list_closed_elections()'));
await db.exec('reset role');
assert.equal(Number((await db.query('select count(*) as n from reservations')).rows[0].n),3);
await db.close();
console.log('Passed: closed days, DST, pagination, assignments only, ambiguous photos, empty results, denied access, no mutations.');
