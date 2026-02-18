import { Router } from 'express';
import { config } from '../../config';
import userRoutes from './user.routes';
import packagesRoutes from './packages.routes';
import referralRoutes from './referral.routes';
import paymentRoutes from './payment.routes';
import subscriptionRoutes from './subscription.routes';
import audioRoutes from './audio.routes';
import imageRoutes from './image.routes';
import videoRoutes from './video.routes';

const webappRouter = Router();

webappRouter.use(userRoutes);
webappRouter.use(packagesRoutes);
webappRouter.use(referralRoutes);
webappRouter.use(paymentRoutes);
webappRouter.use(subscriptionRoutes);
if (config.features.audioEnabled) {
  webappRouter.use(audioRoutes);
}
webappRouter.use(imageRoutes);
webappRouter.use(videoRoutes);

export default webappRouter;
