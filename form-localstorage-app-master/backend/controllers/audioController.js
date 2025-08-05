import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funzione per convertire WebM in WAV PCM
function convertToAzureWav(inputBuffer, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = new Readable();
    stream.push(inputBuffer);
    stream.push(null);

    ffmpeg(stream)
      .inputFormat('webm')
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}

// Gestione dell'upload dell'audio
export async function uploadAudio(req, res){
  try{
    if (!req.file) {
      return res.status(400).send('Nessun file audio ricevuto.');
    } 

    const uploadPath = path.join(__dirname, '..', 'uploads'); // Percorso per la repository degli upload
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, {recursive: true}); // Se la rep non esiste la crea
    }

    const files = fs.readdirSync(uploadPath).filter(file => file.startsWith('audio-')); // Leggi i file esistenti che iniziano con 'audio-'
    const nextNum = (files.length + 1).toString().padStart(2, '0') // Calcolo del prossimo numero con padding a 2 cifre
    const fileName = `audio-${nextNum}.wav`;
    const finalPath = path.join(uploadPath, fileName);

    // Conversione WebM → WAV
    await convertToAzureWav(req.file.buffer, finalPath);
    console.log('Conversione completata:', fileName);

    // Invia il file convertito ad Azure Speech
    const audioData = fs.readFileSync(finalPath);
    const url = `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=it-IT`;
    
    const response = await axios.post(url, audioData, {  // Invio richiesta POST a AzureSpeech
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY, 
        'Content-Type': 'audio/wav',
        'Accept': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.status(200).json({
      message: 'Audio salvato e inviato per trascrizione.',
      transcriptionJob: response.data
    });

  }catch(error){
    res.status(500).json({ error: "Errore nella trascrizone con Azure", details: error.toString() });
  }
};