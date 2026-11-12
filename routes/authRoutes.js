const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { verifyDoctor, verifyStudent, verifyTeacher, verifyAdmin, JWT_SECRET } = require('../middleware/auth');

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

// Student Signup
router.post('/student/signup', (req, res) => {
  try {
    const { name, email, password, university, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newStudent = {
      id: 'stu_' + Date.now(),
      name,
      email,
      password: hashedPassword,
      role: 'student',
      university: university || 'Veterinary University / College',
      semester: semester || 'DVM Student',
      createdAt: new Date().toISOString()
    };

    db.addUser(newStudent);

    const token = jwt.sign({ id: newStudent.id, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Student account created successfully.',
      token,
      user: {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        role: newStudent.role,
        university: newStudent.university,
        semester: newStudent.semester
      }
    });
  } catch (err) {
    console.error('Student signup error:', err);
    res.status(500).json({ error: 'Internal server error during student registration.' });
  }
});

// Student Login
router.post('/student/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.role !== 'student') {
      return res.status(401).json({ error: 'Invalid student credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid student credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Student login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        university: user.university,
        semester: user.semester
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Student Profile Me
router.get('/student/me', verifyStudent, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Teacher Signup
router.post('/teacher/signup', (req, res) => {
  try {
    const { name, email, password, department, university } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newTeacher = {
      id: 'teacher_' + Date.now(),
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      department: department || 'Department of Clinical Veterinary Medicine',
      university: university || 'Faculty of Veterinary Sciences',
      createdAt: new Date().toISOString()
    };

    db.addUser(newTeacher);

    const token = jwt.sign({ id: newTeacher.id, role: 'teacher' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Teacher account registered successfully.',
      token,
      user: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        role: newTeacher.role,
        department: newTeacher.department,
        university: newTeacher.university
      }
    });
  } catch (err) {
    console.error('Teacher signup error:', err);
    res.status(500).json({ error: 'Internal server error during teacher registration.' });
  }
});

// Teacher Login
router.post('/teacher/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return res.status(401).json({ error: 'Invalid teacher credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid teacher credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Teacher login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        university: user.university
      }
    });
  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).json({ error: 'Internal server error during teacher login.' });
  }
});

// Teacher Profile Me
router.get('/teacher/me', verifyTeacher, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Admin Login (Aliased to support teacher or admin)
router.post('/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Authentication successful.',
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
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Admin Profile Me
router.get('/admin/me', verifyTeacher, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

module.exports = router;
