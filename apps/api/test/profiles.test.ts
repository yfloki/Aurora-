import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { openDb, type Db } from '../src/db';
import { createProfilesRouter } from '../src/routes/profiles';

let db: Db; let app: express.Express;
beforeEach(() => {
  db = openDb(':memory:');
  db.prepare(`INSERT INTO titles (id, slug, name) VALUES ('t1','t1','Filme')`).run();
  app = express().use(express.json()).use('/api/profiles', createProfilesRouter(db));
});

describe('perfis', () => {
  it('cria e lista perfis', async () => {
    const created = await request(app).post('/api/profiles').send({ name: 'Leo', avatar: 'red' });
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTruthy();
    const list = await request(app).get('/api/profiles');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe('Leo');
  });

  it('salva e lê progresso (upsert)', async () => {
    const p = (await request(app).post('/api/profiles').send({ name: 'Leo', avatar: 'red' })).body;
    await request(app).put(`/api/profiles/${p.id}/progress/t1`).send({ positionS: 30, durationS: 600 });
    await request(app).put(`/api/profiles/${p.id}/progress/t1`).send({ positionS: 95, durationS: 600 });
    const res = await request(app).get(`/api/profiles/${p.id}/progress`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].positionS).toBe(95);
    expect(res.body[0].titleId).toBe('t1');
  });

  it('minha lista: adiciona, lista e remove', async () => {
    const p = (await request(app).post('/api/profiles').send({ name: 'Leo', avatar: 'red' })).body;
    await request(app).put(`/api/profiles/${p.id}/list/t1`);
    expect((await request(app).get(`/api/profiles/${p.id}/list`)).body).toEqual(['t1']);
    await request(app).delete(`/api/profiles/${p.id}/list/t1`);
    expect((await request(app).get(`/api/profiles/${p.id}/list`)).body).toEqual([]);
  });

  it('POST sem name retorna 400', async () => {
    expect((await request(app).post('/api/profiles').send({ avatar: 'red' })).status).toBe(400);
  });
});
