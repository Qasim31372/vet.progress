require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` 🐾 Mafaza-tul-Hayat-al-Hewan Veterinary Portal is running!`);
  console.log(` 🌐 Public Portal:  http://localhost:${PORT}/`);
  console.log(` 🩺 Doctor Panel:   http://localhost:${PORT}/doctor/login.html`);
  console.log(` 🛡️  Admin Panel:    http://localhost:${PORT}/admin/login.html`);
  console.log(`================================================================`);
});
