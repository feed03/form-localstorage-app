// Importa Express e CORS
const express = require('express');
const cors = require('cors');
const audioRoutes = require('./routes/audioRoutes');


const app = express(); // Crea un'applicazione Express

app.use(cors()); // Abilita CORS per permettere richieste dal frontend (es. localhost:4200)
app.use(express.json()); // Middleware per leggere JSON dal body delle richieste

const userRoutes = require('./routes/numberRoutes'); // Importa le rotte utenti

// Usa le rotte importate sotto il prefisso /api/users
app.use('/api/numero', userRoutes);
app.use('/upload-audio', audioRoutes);

// Server in ascolto sulla porta 3000 
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
