import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Type for token payload
export interface TokenPayload {
  userId: string;
  email: string;
}

// Type for tokens
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Password verification
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT tokens (access + refresh)
export const generateTokens = (payload: TokenPayload): Tokens => {
  // Get secrets and expiration from environment variables
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  
  const accessExpiration = process.env.JWT_ACCESS_EXPIRATION 
    ? parseInt(process.env.JWT_ACCESS_EXPIRATION) 
    : 3600; // Default: 1 hour
    
  const refreshExpiration = process.env.JWT_REFRESH_EXPIRATION 
    ? parseInt(process.env.JWT_REFRESH_EXPIRATION) 
    : 2592000; // Default: 30 days

  // Generate tokens
  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: accessExpiration,
  });

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpiration,
  });

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token: string, isRefreshToken = false): TokenPayload => {
  const secret = isRefreshToken 
    ? process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret'
    : process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    
  return jwt.verify(token, secret) as TokenPayload;
};

// Get token from Authorization header
export const getTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}; 