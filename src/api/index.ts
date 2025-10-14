import express, { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './user';
import { authMiddleware } from '../middleware/auth';
import { subscriptionRouter } from './subscriptions';
import { propertiesRouter } from './property';
import { chatRouter } from './chat';
import { ticketRouter } from './tickets';
import { subscriptionMiddleware } from '../middleware/subscription';
import { SubscriptionFeatures } from '../lib/subscription';

const router: Router = express.Router();

//router.use("/data" , authMiddleware as any , dataRouter) ; 

router.use("/auth", authRouter);
router.use("/users", authMiddleware as any, userRouter);
router.use("/", authMiddleware as any, subscriptionRouter);
router.use("/property", propertiesRouter);
router.use("/chat", authMiddleware as any, subscriptionMiddleware(SubscriptionFeatures.chat) as any, chatRouter);
router.use("/ticket", authMiddleware as any, ticketRouter);
export { router as apiRouter }