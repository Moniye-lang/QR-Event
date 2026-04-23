import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function checkAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string, role: string };
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch (err) {
    return null;
  }
}
