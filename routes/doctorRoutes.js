const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/database');
const { verifyDoctor } = require('../middleware/auth');
const { uploadFile } = require('../config/gdrive');

// Temporary disk storage for incoming upload streams before Drive/Local save
const upload = multer({
  dest: path.join(__dirname, '../temp_uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

// All doctor routes require Doctor verification
router.use(verifyDoctor);

// Submit a new treatment case
router.post('/treatments', upload.array('images', 5), async (req, res) => {
  try {
    const {
      caseTitle,
      animalSpecies,
      category,
      symptoms,
      diagnosis,
      medication,
      outcomeStatus
    } = req.body;

    if (!caseTitle || !animalSpecies || !category || !diagnosis || !medication || !outcomeStatus) {
      return res.status(400).json({ error: 'Please provide all required fields: title, animal species, category, diagnosis, medication, and outcome status.' });
    }

    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadFile(file);
        uploadedImages.push(uploaded);
      }
    }

    const newTreatment = {
      id: 'treat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      doctorId: req.user.id,
      doctorName: req.user.name,
      doctorClinic: req.user.clinicName || 'Private Practice',
      doctorSpecialization: req.user.specialization || 'Veterinarian',
      caseTitle,
      animalSpecies,
      category, // e.g. "Livestock - Cattle/Buffalo", "Livestock - Sheep/Goat", "Equine", "Pets - Dogs/Cats", "Poultry & Birds", "Exotics"
      symptoms: symptoms || '',
      diagnosis,
      medication,
      outcomeStatus, // "recovered", "under_treatment", "chronic", "deceased"
      images: uploadedImages,
      approvalStatus: 'pending', // "pending", "approved", "rejected"
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addTreatment(newTreatment);

    res.status(201).json({
      message: 'Treatment case submitted successfully and is pending admin approval.',
      treatment: newTreatment
    });
  } catch (err) {
    console.error('Submit treatment error:', err);
    res.status(500).json({ error: 'Failed to submit treatment case. Please try again.' });
  }
});

// Get all cases submitted by the logged-in doctor
router.get('/treatments', (req, res) => {
  try {
    const allTreatments = db.getTreatments();
    const doctorTreatments = allTreatments.filter(t => t.doctorId === req.user.id);
    res.json({ treatments: doctorTreatments });
  } catch (err) {
    console.error('Fetch doctor treatments error:', err);
    res.status(500).json({ error: 'Failed to fetch submitted treatments.' });
  }
});

// Delete own pending case
router.delete('/treatments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const treatment = db.findTreatmentById(id);

    if (!treatment) {
      return res.status(404).json({ error: 'Treatment case not found.' });
    }

    if (treatment.doctorId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this treatment case.' });
    }

    if (treatment.approvalStatus === 'approved') {
      return res.status(400).json({ error: 'Approved treatment cases cannot be deleted directly. Contact admin.' });
    }

    const all = db.getTreatments().filter(t => t.id !== id);
    const dbData = { users: db.getUsers(), treatments: all };
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, '../data/db.json'), JSON.stringify(dbData, null, 2));

    res.json({ message: 'Treatment case deleted successfully.' });
  } catch (err) {
    console.error('Delete treatment error:', err);
    res.status(500).json({ error: 'Failed to delete treatment case.' });
  }
});

module.exports = router;
