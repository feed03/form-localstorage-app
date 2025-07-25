const express = require('express');
const router = express.Router();
const { getRandomNumber } = require('../controllers/numberController');

// Definisce la rotta GET /api/numero → genera e restituisce numero casuale
router.get('/', getRandomNumber);

module.exports = router;
