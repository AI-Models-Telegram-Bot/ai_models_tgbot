import { Router } from 'express';
import userRoutes from './user.routes';
import packagesRoutes from './packages.routes';
import referralRoutes from './referral.routes';
import paymentRoutes from './payment.routes';
import subscriptionRoutes from './subscription.routes';
import audioRoutes from './audio.routes';

const webappRouter = Router();

webappRouter.use(userRoutes);
webappRouter.use(packagesRoutes);
webappRouter.use(referralRoutes);
webappRouter.use(paymentRoutes);
webappRouter.use(subscriptionRoutes);
webappRouter.use(audioRoutes);

export default webappRouter;
