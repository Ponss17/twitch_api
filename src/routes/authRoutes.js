const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/twitch', authController.login);
router.get('/twitch/callback', authController.callback);

module.exports = router;
