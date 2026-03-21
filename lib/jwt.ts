import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'evicheck-super-secret-key-that-is-very-long-and-secure';
  if (!secret || secret.length === 0) {
    throw new Error('The environment variable JWT_SECRET is not set.');
  }
  return secret;
};

export const signJwt = async (payload: { id: string; email: string; userType: string }) => {
  const secret = getJwtSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Cookie valid for 1 day
    .sign(new TextEncoder().encode(secret));
  
  return token;
};

export const verifyJwt = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch (error) {
    return null;
  }
};
