const path = require('path');
const fs = require('fs');

// Funzione exportata per gestire l'upload
exports.uploadAudio = (req, res) => {
    // Controlla se il file è stato ricevuto correttamente
    if (!req.file) {
    return res.status(400).send('Nessun file audio ricevuto.');
  }

  const uploadPath = path.join(__dirname, '..', 'uploads'); // Percorso per la rep

  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath); // Se la rep non esiste la crea

  const finalPath = path.join(uploadPath, req.file.originalname); // Percorso per il file

  fs.writeFile(finalPath, req.file.buffer, (err) => {
    if (err) {
        return res.status(500).send('Errore nel salvataggio del file');
    } else {
        res.status(200).send('Audio ricevuto con successo.');
        console.log('Audio ricevuto e salvato in:', finalPath);
    }
  });
};
