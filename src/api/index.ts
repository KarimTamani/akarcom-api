import express, { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './user';
import { authMiddleware } from '../middleware/auth';
import { subscriptionRouter } from './subscriptions';
import { propertiesRouter } from './property';
 
const router : Router = express.Router();

//router.use("/data" , authMiddleware as any , dataRouter) ; 

router.use("/auth" ,  authRouter) ; 
router.use("/users" , authMiddleware  as any , userRouter) ;
router.use("/" , authMiddleware as any, subscriptionRouter ) ; 
router.use("/property" , authMiddleware as any , propertiesRouter) ; 

export {router as apiRouter}