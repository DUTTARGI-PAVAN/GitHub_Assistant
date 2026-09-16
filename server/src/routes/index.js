import { Router } from 'express';
import repoRoutes from './repoRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'github-assistant-server',
  });
});

// Mounted module routes
router.use('/repos', repoRoutes);
router.use('/chat', chatRoutes);

export default router;
