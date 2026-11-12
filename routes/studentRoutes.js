const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Student route: Get all APPROVED clinical cases for study
router.get('/cases', (req, res) => {
  try {
    const { category, outcomeStatus, search } = req.query;
    let allTreatments = db.getTreatments() || [];

    // Students study Admin-Approved clinical cases
    let approved = allTreatments.filter(t => t.approvalStatus === 'approved');

    // Filter by Category
    if (category && category !== 'all') {
      approved = approved.filter(t => t.category && t.category.toLowerCase().includes(category.toLowerCase()));
    }

    // Filter by Outcome Status
    if (outcomeStatus && outcomeStatus !== 'all') {
      approved = approved.filter(t => t.outcomeStatus === outcomeStatus);
    }

    // Search
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
      cases: approved,
      treatments: approved // for backwards compatibility
    });
  } catch (err) {
    console.error('Fetch student cases error:', err);
    res.status(500).json({ error: 'Failed to retrieve cases for student learning.' });
  }
});

// Get single clinical case study for student
router.get('/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const treatment = db.findTreatmentById(id);

    if (!treatment || treatment.approvalStatus !== 'approved') {
      return res.status(404).json({ error: 'Case study not found or not published.' });
    }

    res.json({ caseStudy: treatment, treatment });
  } catch (err) {
    console.error('Fetch single student case error:', err);
    res.status(500).json({ error: 'Failed to fetch case study details.' });
  }
});

// Get student learning meta statistics
router.get('/meta', (req, res) => {
  try {
    const approved = (db.getTreatments() || []).filter(t => t.approvalStatus === 'approved');

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
    console.error('Fetch student meta error:', err);
    res.status(500).json({ error: 'Failed to fetch student learning statistics.' });
  }
});

// Quick pharmacology / medication reference extracted from real approved cases
router.get('/medications', (req, res) => {
  try {
    const approved = (db.getTreatments() || []).filter(t => t.approvalStatus === 'approved');
    const medicationList = [];

    approved.forEach(t => {
      if (t.medication) {
        medicationList.push({
          caseId: t.id,
          caseTitle: t.caseTitle,
          species: t.animalSpecies,
          diagnosis: t.diagnosis,
          medication: t.medication,
          outcome: t.outcomeStatus
        });
      }
    });

    res.json({ medications: medicationList });
  } catch (err) {
    console.error('Fetch medications error:', err);
    res.status(500).json({ error: 'Failed to retrieve medication guide.' });
  }
});

module.exports = router;
