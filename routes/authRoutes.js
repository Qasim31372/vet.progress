const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { verifyDoctor, verifyAdmin, JWT_SECRET } = require('../middleware/auth');

// Doctor Signup
router.post('/doctor/signup', (req, res) => {
  try {
    const { name, email, password, phone, clinicName, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newDoctor = {
      id: 'doc_' + Date.now(),
      name,
      email,
      password: hashedPassword,
      role: 'doctor',
      phone: phone || '',
      clinicName: clinicName || '',
      specialization: specialization || 'Veterinary Practitioner',
      createdAt: new Date().toISOString()
    };

    db.addUser(newDoctor);

    const token = jwt.sign({ id: newDoctor.id, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Doctor account created successfully.',
      token,
      user: {
        id: newDoctor.id,
        name: newDoctor.name,
        email: newDoctor.email,
        role: newDoctor.role,
        clinicName: newDoctor.clinicName,
        specialization: newDoctor.specialization
      }
    });
  } catch (err) {
    console.error('Doctor signup error:', err);
    res.status(500).json({ error: 'Internal server error during doctor registration.' });
  }
});

// Doctor Login
router.post('/doctor/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.role !== 'doctor') {
      return res.status(401).json({ error: 'Invalid doctor credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid doctor credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Doctor login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicName: user.clinicName,
        specialization: user.specialization
      }
    });
  } catch (err) {
    console.error('Doctor login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Doctor Profile Me
router.get('/doctor/me', verifyDoctor, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Admin Login (Strictly isolated from Doctor login)
router.post('/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Admin authentication successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error during admin authentication.' });
  }
});

// Admin Profile Me
router.get('/admin/me', verifyAdmin, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

module.exports = router;
