import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import Database from 'better-sqlite3';
import { createSessionMiddleware } from './sessionConfig';

test('extracted middleware persists sessions, rotates IDs, and destroys logout sessions', async () => {
  const db = new Database(':memory:');
  const app = express();
  app.use(createSessionMiddleware(db));
  app.get('/login', (req, res, next) => req.session.regenerate(error => {
    if (error) return next(error);
    req.session.userId = 42;
    res.json({ok:true});
  }));
  app.get('/me', (req,res) => res.json({id:req.session.userId ?? null}));
  app.post('/logout', (req,res,next) => req.session.destroy(error => error ? next(error) : res.json({ok:true})));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening',resolve));
  const origin = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
  try {
    const login = await fetch(origin+'/login');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    assert.match(login.headers.get('set-cookie')!, /HttpOnly/);
    assert.match(login.headers.get('set-cookie')!, /SameSite=Lax/);
    assert.deepEqual(await (await fetch(origin+'/me',{headers:{cookie}})).json(),{id:42});
    const second = await fetch(origin+'/login',{headers:{cookie}});
    const replacement = second.headers.get('set-cookie')!.split(';')[0];
    assert.notEqual(replacement,cookie);
    assert.deepEqual(await (await fetch(origin+'/me',{headers:{cookie}})).json(),{id:null});
    await fetch(origin+'/logout',{method:'POST',headers:{cookie:replacement}});
    assert.deepEqual(await (await fetch(origin+'/me',{headers:{cookie:replacement}})).json(),{id:null});
    assert.equal((db.prepare('SELECT COUNT(*) AS count FROM express_sessions').get() as {count:number}).count,0);
  } finally {
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    db.close();
  }
});
