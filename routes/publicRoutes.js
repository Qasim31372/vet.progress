const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Public route: Get all APPROVED treatment cases (No authentication required)
router.get('/treatments', (req, res) => {
  try {
    const { category, outcomeStatus, search } = req.query;
    let allTreatments = db.getTreatments();

    // STRICT RULE: Public can ONLY view Admin-Approved cases
    let approved = allTreatments.filter(t => t.approvalStatus === 'approved');

    // Filter by Category
    if (category && category !== 'all') {
      approved = approved.filter(t => t.category.toLowerCase().includes(category.toLowerCase()));
    }

    // Filter by Recovery / Outcome Status
    if (outcomeStatus && outcomeStatus !== 'all') {
      approved = approved.filter(t => t.outcomeStatus === outcomeStatus);
    }

    // Keyword Search
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      approved = approved.filter(t =>
        (t.caseTitle && t.caseTitle.toLowerCase().includes(q)) ||
        (t.animalSpecies && t.animalSpecies.toLowerCase().includes(q)) ||
        (t.diagnosis && t.diagnosis.toLowerCase().includes(q)) ||
        (t.medication && t.medication.toLowerCase().includes(q)) ||
        (t.symptoms && t.symptoms.toLowerCase().includes(q)) ||
        (t.doctorName && t.doctorName.toLowerCase().includes(q)) ||
        (t.doctorClinic && t.doctorClinic.toLowerCase().includes(q))
      );
    }

    res.json({
      count: approved.length,
      treatments: approved
    });
  } catch (err) {
    console.error('Fetch public treatments error:', err);
    res.status(500).json({ error: 'Failed to retrieve public veterinary database.' });
  }
});

// Get single approved treatment details
router.get('/treatments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const treatment = db.findTreatmentById(id);

    if (!treatment || treatment.approvalStatus !== 'approved') {
      return res.status(404).json({ error: 'Case study not found or not published.' });
    }

    res.json({ treatment });
  } catch (err) {
    console.error('Fetch single treatment error:', err);
    res.status(500).json({ error: 'Failed to fetch case study details.' });
  }
});

// Get categories & statistics for public portal
router.get('/meta', (req, res) => {
  try {
    const approved = db.getTreatments().filter(t => t.approvalStatus === 'approved');

    const categoryCounts = {};
    const statusCounts = {
      recovered: 0,
      under_treatment: 0,
      chronic: 0,
      deceased: 0
    };

    approved.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      if (statusCounts[t.outcomeStatus] !== undefined) {
        statusCounts[t.outcomeStatus]++;
      }
    });

    res.json({
      totalApproved: approved.length,
      categoryCounts,
      statusCounts
    });
  } catch (err) {
    console.error('Fetch public meta error:', err);
    res.status(500).json({ error: 'Failed to fetch directory statistics.' });
  }
});

module.exports = router;
