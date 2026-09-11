const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { verifyAdmin } = require('../middleware/auth');

// All admin routes require Admin verification
router.use(verifyAdmin);

// Dashboard KPI Statistics
router.get('/stats', (req, res) => {
  try {
    const treatments = db.getTreatments();
    const users = db.getUsers();

    const pending = treatments.filter(t => t.approvalStatus === 'pending').length;
    const approved = treatments.filter(t => t.approvalStatus === 'approved').length;
    const rejected = treatments.filter(t => t.approvalStatus === 'rejected').length;
    const totalDoctors = users.filter(u => u.role === 'doctor').length;

    res.json({
      stats: {
        totalCases: treatments.length,
        pendingCases: pending,
        approvedCases: approved,
        rejectedCases: rejected,
        totalDoctors: totalDoctors
      }
    });
  } catch (err) {
    console.error('Fetch admin stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

// Get all treatments (with optional status filter)
router.get('/treatments', (req, res) => {
  try {
    const { status } = req.query;
    let treatments = db.getTreatments();

    if (status) {
      treatments = treatments.filter(t => t.approvalStatus === status);
    }

    res.json({ treatments });
  } catch (err) {
    console.error('Fetch admin treatments error:', err);
    res.status(500).json({ error: 'Failed to fetch treatment queue.' });
  }
});

// Approve a treatment case (Instantly published to Public portal)
router.patch('/treatments/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.findTreatmentById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Treatment record not found.' });
    }

    const updated = db.updateTreatment(id, {
      approvalStatus: 'approved',
      rejectionReason: null,
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.name
    });

    res.json({
      message: 'Treatment case approved successfully. It is now published on the Public Portal.',
      treatment: updated
    });
  } catch (err) {
    console.error('Approve treatment error:', err);
    res.status(500).json({ error: 'Failed to approve treatment case.' });
  }
});

// Reject a treatment case
router.patch('/treatments/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const existing = db.findTreatmentById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Treatment record not found.' });
    }

    const updated = db.updateTreatment(id, {
      approvalStatus: 'rejected',
      rejectionReason: reason || 'Not meeting public publication criteria.',
      rejectedAt: new Date().toISOString()
    });

    res.json({
      message: 'Treatment case rejected.',
      treatment: updated
    });
  } catch (err) {
    console.error('Reject treatment error:', err);
    res.status(500).json({ error: 'Failed to reject treatment case.' });
  }
});

// Get registered doctors list
router.get('/doctors', (req, res) => {
  try {
    const users = db.getUsers();
    const doctors = users
      .filter(u => u.role === 'doctor')
      .map(({ password, ...doc }) => doc);

    res.json({ doctors });
  } catch (err) {
    console.error('Fetch doctors error:', err);
    res.status(500).json({ error: 'Failed to fetch doctor directory.' });
  }
});

// Restore database from Google Drive backup
router.post('/restore-drive', async (req, res) => {
  try {
    const success = await db.restoreFromDrive();
    if (success) {
      return res.json({ message: 'Database successfully restored from Google Drive backup.' });
    } else {
      return res.status(404).json({ error: 'No database backup found on Google Drive.' });
    }
  } catch (err) {
    console.error('Drive restore endpoint error:', err);
    res.status(500).json({ error: 'Failed to restore database from Google Drive.' });
  }
});

// Force sync current database to Google Drive
router.post('/sync-drive', async (req, res) => {
  try {
    await db.syncCurrentDatabaseToDrive();
    res.json({ message: 'Current database backed up to Google Drive successfully.' });
  } catch (err) {
    console.error('Drive sync endpoint error:', err);
    res.status(500).json({ error: 'Failed to sync database to Google Drive.' });
  }
});

module.exports = router;
