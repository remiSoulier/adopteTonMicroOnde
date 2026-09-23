import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
await db.exec(`
create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table photos(id uuid primary key,user_id uuid,url text,legende text,created_at timestamptz);
create table votes(photo_id uuid,voter_id uuid,created_at timestamptz);
create table reservations(id uuid primary key,user_id uuid,microwave_id uuid,date date);
-- Alice: one photo in the closed 2020-03-28 election, won (reservation on 2020-03-29), 2 votes.
insert into photos values('${uid(1)}','${uid(1)}','https://example.com/1','Photo 1','2020-03-27T10:00:00Z');
insert into votes values('${uid(1)}','${uid(10)}','2020-03-28T09:00:00Z'),('${uid(1)}','${uid(11)}','2020-03-28T09:30:00Z');
insert into reservations values('${uid(1)}','${uid(1)}','${uid(90)}','2020-03-29');
-- Bob: one photo in the same closed election, 1 vote, no reservation (lost).
insert into photos values('${uid(2)}','${uid(2)}','https://example.com/2','Photo 2','2020-03-27T11:00:00Z');
insert into votes values('${uid(2)}','${uid(10)}','2020-03-28T09:15:00Z');
-- Alice: a fresh photo, still open (no votes yet, election not closed).
insert into photos values('${uid(3)}','${uid(1)}','https://example.com/3','Photo future','2999-01-01T10:00:00Z');
`);
const sql = readFileSync(new URL('./photo-history.sql', import.meta.url), 'utf8');
await db.exec(sql); await db.exec(sql);

await db.exec('set role anon');
await assert.rejects(db.query('select * from get_my_photo_history()'));
await assert.rejects(db.query(`select * from delete_my_photo('${uid(1)}')`));

await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid(1)}',false)`);
const { rows: alice } = await db.query('select * from get_my_photo_history()');
assert.equal(alice.length, 2);
assert.equal(alice[0].id, uid(3)); // most recent first
assert.equal(alice[0].votes_closed, false);
assert.equal(Number(alice[0].votes_count), 0);
assert.equal(alice[1].id, uid(1));
assert.equal(alice[1].votes_closed, true);
assert.equal(Number(alice[1].votes_count), 2);
assert.equal(alice[1].won, true);
assert.equal((await db.query('select * from get_my_photo_history(1)')).rows.length, 1);

// Alice cannot delete Bob's photo, and cannot delete her own already-voted photo.
await assert.rejects(db.query(`select * from delete_my_photo('${uid(2)}')`));
await assert.rejects(db.query(`select * from delete_my_photo('${uid(1)}')`));
// She can pull back the untouched, still-open one.
await db.query(`select * from delete_my_photo('${uid(3)}')`);
assert.equal((await db.query('select * from get_my_photo_history()')).rows.length, 1);

await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid(2)}',false)`);
const { rows: bob } = await db.query('select * from get_my_photo_history()');
assert.equal(bob.length, 1);
assert.equal(bob[0].won, false);
assert.equal(Number(bob[0].votes_count), 1);

await db.exec("select set_config('request.jwt.claim.sub','',false)");
await assert.rejects(db.query('select * from get_my_photo_history()'));
await db.exec('reset role');
assert.equal(Number((await db.query('select count(*) as n from photos')).rows[0].n), 2);

await db.close();
console.log('Passed: history ordering, vote counts, win detection, open-window state, ownership and vote-guard on delete, denied access.');
