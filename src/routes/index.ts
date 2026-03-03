import { Router } from 'express';
import healthRoutes from './healthRoutes';
import identifyRoutes from './identifyRoutes';
import contactRoutes from './contactRoutes';

const router = Router();

router.use(healthRoutes);
router.use(identifyRoutes);
router.use(contactRoutes);

export default router;
