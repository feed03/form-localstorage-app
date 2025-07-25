const express = require('express');
const multer = require('multer');

const audioController = require('../controllers/audioController'); // Effettiva logica del servizio

const router = express.Router();
const upload = multer(); // Nessun disco, usa buffer

router.post('/', upload.single('audio'), audioController.uploadAudio);

module.exports = router;
