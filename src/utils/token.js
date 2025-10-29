import jwt from 'jsonwebtoken';
import dotenv from 'dotenv-safe';

dotenv.config();

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
};