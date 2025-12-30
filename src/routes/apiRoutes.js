const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const checkToken = require('../middleware/authMiddleware');

router.get('/create-clip', checkToken, apiController.createClip);
router.get('/get-clips', checkToken, apiController.getClips);
router.get('/followage', checkToken, apiController.followage);

module.exports = router;
