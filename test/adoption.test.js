/**
 * Tests funcionales — adoption.router.js
 *
 * Estrategia de aislamiento:
 *  - Se crea una app Express mínima que solo monta el router de adopciones.
 *  - El modelo Adoption se mockea completamente con vi.mock, de modo que
 *    ningún test necesita conexión a MongoDB ni a Vault.
 *  - Se usa supertest para hacer requests HTTP reales contra la app en memoria.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ─── Mock del modelo Adoption ────────────────────────────────────────────────
// Debe declararse ANTES de importar el router para que Vitest intercepte el módulo.
vi.mock('../src/models/Adoption.js', () => ({
  Adoption: {
    find:              vi.fn(),
    findById:          vi.fn(),
    create:            vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

// Importaciones después del mock
import adoptionRouter from '../src/routes/adoption.router.js';
import { Adoption } from '../src/models/Adoption.js';

// ─── App de prueba mínima ────────────────────────────────────────────────────
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/adoptions', adoptionRouter);
  return app;
};

const app = createTestApp();

// ID válido de MongoDB para usar en los tests
const VALID_ID   = '64a1b2c3d4e5f6a7b8c9d0e1';
const INVALID_ID = 'id-no-valido';

// ─── Datos de ejemplo ────────────────────────────────────────────────────────
const adoptionMock = {
  _id:         VALID_ID,
  name:        'Max',
  species:     'dog',
  age:         3,
  description: 'Perro juguetón y amigable',
  status:      'available',
};

// ─── Limpiar mocks entre tests ───────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v1/adoptions — listar todas las adopciones
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/adoptions', () => {
  it('debería retornar 200 con un array de adopciones', async () => {
    Adoption.find.mockResolvedValue([adoptionMock]);

    const res = await request(app).get('/api/v1/adoptions');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('adoptions');
    expect(Array.isArray(res.body.adoptions)).toBe(true);
    expect(res.body.adoptions).toHaveLength(1);
    expect(res.body.adoptions[0].name).toBe('Max');
    expect(Adoption.find).toHaveBeenCalledOnce();
  });

  it('debería retornar 200 con array vacío cuando no hay adopciones', async () => {
    Adoption.find.mockResolvedValue([]);

    const res = await request(app).get('/api/v1/adoptions');

    expect(res.status).toBe(200);
    expect(res.body.adoptions).toHaveLength(0);
  });

  it('debería retornar 500 si la base de datos falla', async () => {
    Adoption.find.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/adoptions');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v1/adoptions/:id — obtener adopción por ID
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/adoptions/:id', () => {
  it('debería retornar 200 con la adopción cuando el ID existe', async () => {
    Adoption.findById.mockResolvedValue(adoptionMock);

    const res = await request(app).get(`/api/v1/adoptions/${VALID_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('adoption');
    expect(res.body.adoption.name).toBe('Max');
    expect(Adoption.findById).toHaveBeenCalledWith(VALID_ID);
  });

  it('debería retornar 404 cuando la adopción no existe', async () => {
    Adoption.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/v1/adoptions/${VALID_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no encontrada/i);
  });

  it('debería retornar 400 si el ID tiene formato inválido', async () => {
    const res = await request(app).get(`/api/v1/adoptions/${INVALID_ID}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/inv[aá]lido/i);
    expect(Adoption.findById).not.toHaveBeenCalled();
  });

  it('debería retornar 500 si la base de datos falla', async () => {
    Adoption.findById.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get(`/api/v1/adoptions/${VALID_ID}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/v1/adoptions — crear nueva adopción
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/adoptions', () => {
  it('debería retornar 201 al crear una adopción válida', async () => {
    const newAdoption = { name: 'Luna', species: 'cat', age: 2 };
    Adoption.create.mockResolvedValue({ ...newAdoption, _id: VALID_ID, status: 'available' });

    const res = await request(app)
      .post('/api/v1/adoptions')
      .send(newAdoption);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('adoption');
    expect(res.body.adoption.name).toBe('Luna');
    expect(res.body.message).toMatch(/creada/i);
    expect(Adoption.create).toHaveBeenCalledWith(newAdoption);
  });

  it('debería retornar 400 si falta el campo name', async () => {
    const res = await request(app)
      .post('/api/v1/adoptions')
      .send({ species: 'dog' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name.*species|requeridos/i);
    expect(Adoption.create).not.toHaveBeenCalled();
  });

  it('debería retornar 400 si falta el campo species', async () => {
    const res = await request(app)
      .post('/api/v1/adoptions')
      .send({ name: 'Toby' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name.*species|requeridos/i);
    expect(Adoption.create).not.toHaveBeenCalled();
  });

  it('debería retornar 400 si el body está vacío', async () => {
    const res = await request(app)
      .post('/api/v1/adoptions')
      .send({});

    expect(res.status).toBe(400);
    expect(Adoption.create).not.toHaveBeenCalled();
  });

  it('debería retornar 500 si la base de datos falla', async () => {
    Adoption.create.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/v1/adoptions')
      .send({ name: 'Rex', species: 'dog' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/adoptions/:id — actualizar adopción
// ═════════════════════════════════════════════════════════════════════════════
describe('PUT /api/v1/adoptions/:id', () => {
  it('debería retornar 200 al actualizar una adopción existente', async () => {
    const updated = { ...adoptionMock, status: 'adopted' };
    Adoption.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .put(`/api/v1/adoptions/${VALID_ID}`)
      .send({ status: 'adopted' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('adoption');
    expect(res.body.adoption.status).toBe('adopted');
    expect(res.body.message).toMatch(/actualizada/i);
    expect(Adoption.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      { status: 'adopted' },
      { new: true, runValidators: true }
    );
  });

  it('debería retornar 404 cuando la adopción a actualizar no existe', async () => {
    Adoption.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/v1/adoptions/${VALID_ID}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no encontrada/i);
  });

  it('debería retornar 400 si el ID es inválido', async () => {
    const res = await request(app)
      .put(`/api/v1/adoptions/${INVALID_ID}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(400);
    expect(Adoption.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('debería retornar 500 si la base de datos falla', async () => {
    Adoption.findByIdAndUpdate.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put(`/api/v1/adoptions/${VALID_ID}`)
      .send({ status: 'adopted' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/adoptions/:id — eliminar adopción
// ═════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/v1/adoptions/:id', () => {
  it('debería retornar 200 al eliminar una adopción existente', async () => {
    Adoption.findByIdAndDelete.mockResolvedValue(adoptionMock);

    const res = await request(app).delete(`/api/v1/adoptions/${VALID_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminada/i);
    expect(Adoption.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
  });

  it('debería retornar 404 cuando la adopción a eliminar no existe', async () => {
    Adoption.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete(`/api/v1/adoptions/${VALID_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no encontrada/i);
  });

  it('debería retornar 400 si el ID es inválido', async () => {
    const res = await request(app).delete(`/api/v1/adoptions/${INVALID_ID}`);

    expect(res.status).toBe(400);
    expect(Adoption.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('debería retornar 500 si la base de datos falla', async () => {
    Adoption.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete(`/api/v1/adoptions/${VALID_ID}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});
