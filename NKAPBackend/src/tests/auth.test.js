const request = require('supertest');
const app = require('../app');  // Assure-toi que ton app Express est exportée

describe('POST /login', () => {
  it('devrait renvoyer un token JWT et un refresh token pour un utilisateur valide', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('devrait renvoyer une erreur 401 pour un mot de passe incorrect', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })
      .expect(401);

    expect(response.body.message).toBe('Mot de passe incorrect');
  });

  it('devrait renvoyer une erreur 404 si l\'utilisateur n\'est pas trouvé', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' })
      .expect(404);

    expect(response.body.message).toBe('Utilisateur non trouvé');
  });
});
