require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Convenient route redirects for Panels
app.get('/student', (req, res) => {
  res.redirect('/student/dashboard.html');
});
app.get('/teacher', (req, res) => {
  res.redirect('/teacher/login.html');
});
app.get('/admin', (req, res) => {
  res.redirect('/teacher/login.html');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/public', publicRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` 🐾 Vet Learn Hub - Veterinary Learning & Clinical Case Portal`);
  console.log(` 🎓 Student Panel:     http://localhost:${PORT}/`);
  console.log(` 📚 Student Dashboard: http://localhost:${PORT}/student/dashboard.html`);
  console.log(` 🩺 Doctor Panel:      http://localhost:${PORT}/doctor/login.html`);
  console.log(` 👨‍🏫 Teacher Panel:     http://localhost:${PORT}/teacher/login.html`);
  console.log(`================================================================`);
});
