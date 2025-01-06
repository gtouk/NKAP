// tests/userRoutes.test.js
const request = require('supertest');
const express = require('express');
const userRoutes = require('../src/routes/userRoutes');
const db = require('../src/config/db');

jest.mock('../src/config/db'); // Simule la base de données

const app = express();
app.use(express.json());
app.use('/api', userRoutes);

describe('POST /login', () => {
  it('should return 200 and tokens if credentials are valid', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    // Simuler la base de données pour retourner un utilisateur valide
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query.mockImplementation((query, params, callback) => {
      callback(null, [{ id: 1, email: 'test@example.com', password: hashedPassword }]);
    });

    const response = await request(app)
      .post('/api/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('should return 400 if email or password is missing', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: '', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email et mot de passe requis');
  });

  it('should return 404 if user not found', async () => {
    db.query.mockImplementation((query, params, callback) => {
      callback(null, []);
    });

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Utilisateur non trouvé');
  });
});
