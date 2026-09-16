import { Router } from 'express';
import {
  sendChatMessage,
  getChatHistory,
} from '../controllers/chatController.js';

const router = Router();

router.post('/', sendChatMessage);
router.get('/history/:sessionId', getChatHistory);

export default router;
