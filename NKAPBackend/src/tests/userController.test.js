// __tests__/userController.test.js
const request = require('supertest');
const app = require('../../server'); // Ton fichier principal avec l'app Express


describe('POST /register', () => {
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Utilisateur enregistré avec succès!');
  });

  it('should return error if required fields are missing', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        email: 'john.doe@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Tous les champs sont requis.');
  });
});

describe('POST /login', () => {
    it('should log in a user successfully and return tokens', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  
    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });
  
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });
  
    it('should return error if password is incorrect', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'john.doe@example.com',
          password: 'wrongpassword',
        });
  
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Mot de passe incorrect');
    });
  });
  

  describe('GET /profile', () => {
    it('should return the user profile', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validAccessToken}`); // Utilise un token valide ici
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });
  
    it('should return error if no token is provided', async () => {
      const response = await request(app)
        .get('/profile');
  
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token requis');
    });
  });
  

  describe('PUT /profile', () => {
    it('should update the user profile successfully', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated.email@example.com',
        });
  
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profil utilisateur mis à jour avec succès');
    });
  
    it('should return error if email is invalid', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: 'Updated Name',
          email: 'invalid-email',
        });
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('L\'email n\'est pas valide.');
    });
  
    it('should return error if name or email is missing', async () => {
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          name: '',
          email: '',
        });
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Le nom et l\'email sont obligatoires.');
    });
  });
  
  describe('POST /refresh-token', () => {
    it('should refresh the access token with a valid refresh token', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({
          refreshToken: validRefreshToken,  // Utilise un refresh token valide ici
        });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });
  
    it('should return error if refresh token is invalid or expired', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({
          refreshToken: 'invalidOrExpiredToken',
        });
  
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Refresh token invalide ou expiré');
    });
  
    it('should return error if no refresh token is provided', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({});
  
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Refresh token requis');
    });
  });
  
  describe('DELETE /profile', () => {
    it('should delete the user profile successfully', async () => {
      const response = await request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${validAccessToken}`);
  
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profil utilisateur supprimé avec succès');
    });
  
    it('should return error if user not found', async () => {
      const response = await request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${invalidAccessToken}`);
  
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });
  });
  