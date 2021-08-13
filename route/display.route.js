const express = require('express');
const router = express.Router();

const displayController = require('../controller/display.controller');

router.get('/', displayController.display);

module.exports = router;