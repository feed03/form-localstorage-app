const path = require('path');
const fs = require('fs');

// Funzione exportata per gestire l'upload
exports.uploadAudio = (req, res) => {
  // Controlla se il file è stato ricevuto correttamente
  if (!req.file) {
    return res.status(400).send('Nessun file audio ricevuto.');
  } 

  const uploadPath = path.join(__dirname, '..', 'uploads'); // Percorso per la rep

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, {recursive: true}); // Se la rep non esiste la crea
  }
  
  const files = fs.readdirSync(uploadPath).filter(file => file.startsWith('audio-')); // Leggi i file esistenti che iniziano con 'audio-'
  const nextNum = (files.length + 1).toString().padStart(2, '0') // Calcolo del prossimo numero con padding a 2 cifre
  const fileName = `audio-${nextNum}.webm`;
  const finalPath = path.join(uploadPath, fileName);

  fs.writeFile(finalPath, req.file.buffer, (err) => {
    if (err) {
        return res.status(500).send('Errore nel salvataggio del file');
    } else {
        console.log('Audio ricevuto e salvato in:', finalPath);
        res.status(200).send('Audio salvato come: ' + fileName);
    }
  });
};     
