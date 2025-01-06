const { generateAccessToken } = require('../utils/jwtUtils');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');  // Mock de la bibliothèque JWT

describe('generateAccessToken', () => {
  it('devrait générer un token JWT valide', () => {
    const userId = 1;
    const mockToken = 'mocked_token';
    jwt.sign.mockReturnValue(mockToken);

    const token = generateAccessToken(userId);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    expect(token).toBe(mockToken);
  });
});
