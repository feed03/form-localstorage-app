import express from 'express';
import multer from 'multer';
import { uploadAudio } from '../controllers/audioController.js'; // Effettiva logica del servizio

const router = express.Router();
const upload = multer(); // Nessun disco, usa buffer

router.post('/', upload.single('audio'), uploadAudio);

export default router;
