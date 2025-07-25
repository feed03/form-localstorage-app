// Importa Express e CORS
const express = require('express');
const cors = require('cors');

// Crea un'applicazione Express
const app = express();

// Abilita CORS per permettere richieste dal frontend (es. localhost:4200)
app.use(cors());

// Middleware per leggere JSON dal body delle richieste
app.use(express.json());

// Importa le rotte utenti
const userRoutes = require('./routes/numberRoutes');

// Usa le rotte importate sotto il prefisso /api/users
app.use('/api/numero', userRoutes);

// Server in ascolto sulla porta 3000 
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
