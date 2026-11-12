const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'vet_portal_super_secret_jwt_key_2026_x99';

// Extract token from Header or Query
function getToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

// Verify Doctor Authentication
function verifyDoctor(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Doctor authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ error: 'Access forbidden. Doctor account required.' });
    }

    const user = db.findUserById(decoded.id);
    if (!user || user.role !== 'doctor') {
      return res.status(401).json({ error: 'Invalid or inactive doctor account.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Verify Student Authentication
function verifyStudent(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Student authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'student') {
      return res.status(403).json({ error: 'Access forbidden. Student account required.' });
    }

    const user = db.findUserById(decoded.id);
    if (!user || user.role !== 'student') {
      return res.status(401).json({ error: 'Invalid or inactive student account.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired student authentication token.' });
  }
}

// Verify Teacher / Faculty Authentication
function verifyTeacher(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Teacher authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden. Teacher / Faculty role required.' });
    }

    const user = db.findUserById(decoded.id);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return res.status(401).json({ error: 'Invalid or inactive teacher account.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired teacher authentication token.' });
  }
}

// Verify Admin Authentication (Compatibility alias)
function verifyAdmin(req, res, next) {
  return verifyTeacher(req, res, next);
}

module.exports = {
  verifyDoctor,
  verifyStudent,
  verifyTeacher,
  verifyAdmin,
  JWT_SECRET
};
