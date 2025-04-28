const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'insecuresecret';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET); // ❌ Sin verificación de algoritmo
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

module.exports = { verifyToken };
