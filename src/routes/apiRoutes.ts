import express from 'express';
import * as apiController from '../controllers/apiController';
import checkToken from '../middleware/authMiddleware';

const router = express.Router();

router.get('/create-clip', checkToken, apiController.createClip);
router.get('/get-clips', checkToken, apiController.getClips);
router.get('/followage', checkToken, apiController.followage);

export default router;
