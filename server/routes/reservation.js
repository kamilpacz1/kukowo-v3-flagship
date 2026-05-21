const express = require('express');
const router = express.Router();
const { handleReservation } = require('../controllers/reservationController');

// Obsługa POST /api/reservation
router.post('/', handleReservation);

module.exports = router;
