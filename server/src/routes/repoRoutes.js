import { Router } from 'express';
import {
  ingestRepository,
  listRepositories,
  getRepositoryById,
} from '../controllers/repoController.js';

const router = Router();

router.post('/ingest', ingestRepository);
router.get('/', listRepositories);
router.get('/:id', getRepositoryById);

export default router;
