const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware do parsowania JSON
app.use(express.json());

// Serwowanie statycznych plików z folderu client
app.use(express.static(path.join(__dirname, '../client')));

// Import tras rezerwacji
const reservationRoutes = require('./routes/reservation');
app.use('/api/reservation', reservationRoutes);

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
