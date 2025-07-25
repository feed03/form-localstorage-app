// Genera un numero casuale tra 1 e 100
const getRandomNumber = (req, res) => {
  const numero = Math.floor(Math.random() * 100) + 1;
  res.json({ numero });
};

module.exports = { getRandomNumber };
