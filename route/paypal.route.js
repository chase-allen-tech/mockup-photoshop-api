const express = require('express');
const router = express.Router();

const paypalController = require('../controller/paypal.controller');

router.post('/transfer', paypalController.transfer);
router.get('/success', paypalController.success)

module.exports = router;