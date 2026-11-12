const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const defaultData = {
  users: [],
  treatments: []
};

function readData() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!Array.isArray(parsed.treatments)) parsed.treatments = [];
    return parsed;
  } catch (err) {
    console.error('Error reading DB, resetting to default:', err);
    return defaultData;
  }
}

function writeData(data) {
  const tempPath = DB_FILE + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, DB_FILE);

  try {
    const { syncDatabaseToDrive } = require('../config/gdrive');
    syncDatabaseToDrive(data).catch(err => {
      console.error('Asynchronous Drive DB sync error:', err.message);
    });
  } catch (err) {
    // Ignore require cycle during initial startup
  }
}

function initSeed() {
  const db = readData();
  const teacherEmail = process.env.TEACHER_EMAIL || 'teacher@vetlearnhub.com';
  const teacherPassword = process.env.TEACHER_PASSWORD || 'teacher123';

  const existingFaculty = db.users.find(u => u.role === 'teacher' || u.role === 'admin');
  if (!existingFaculty) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(teacherPassword, salt);

    const teacherUser = {
      id: 'teacher_' + Date.now(),
      name: 'Faculty Teacher',
      email: teacherEmail,
      password: hashedPassword,
      role: 'teacher',
      specialization: 'Veterinary Clinical Professor & Head of Department',
      clinicName: 'Faculty of Veterinary Sciences',
      createdAt: new Date().toISOString()
    };

    db.users.push(teacherUser);
    writeData(db);
    console.log(`[DB] Seeded initial teacher account: ${teacherEmail} / ${teacherPassword}`);
  }
}

initSeed();

async function restoreFromDrive() {
  try {
    const { fetchDatabaseFromDrive } = require('../config/gdrive');
    const driveData = await fetchDatabaseFromDrive();
    if (driveData && driveData.users && driveData.treatments) {
      const tempPath = DB_FILE + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(driveData, null, 2));
      fs.renameSync(tempPath, DB_FILE);
      console.log('[DB SUCCESS] Database fully retrieved and restored from Google Drive!');
      return true;
    }
  } catch (err) {
    console.error('Failed to restore database from Drive:', err.message);
  }
  return false;
}

// Restore from Drive on startup asynchronously
restoreFromDrive().catch(err => console.error(err));

module.exports = {
  getUsers: () => readData().users,
  findUserByEmail: (email) => {
    const users = readData().users;
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id) => {
    const users = readData().users;
    return users.find(u => u.id === id);
  },
  addUser: (user) => {
    const db = readData();
    db.users.push(user);
    writeData(db);
    return user;
  },

  getTreatments: () => readData().treatments,
  findTreatmentById: (id) => {
    const db = readData();
    return db.treatments.find(t => t.id === id);
  },
  addTreatment: (treatment) => {
    const db = readData();
    db.treatments.unshift(treatment);
    writeData(db);
    return treatment;
  },
  updateTreatment: (id, updates) => {
    const db = readData();
    const index = db.treatments.findIndex(t => t.id === id);
    if (index !== -1) {
      db.treatments[index] = {
        ...db.treatments[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      writeData(db);
      return db.treatments[index];
    }
    return null;
  },
  syncCurrentDatabaseToDrive: () => {
    const data = readData();
    const { syncDatabaseToDrive } = require('../config/gdrive');
    return syncDatabaseToDrive(data);
  },
  restoreFromDrive
};
