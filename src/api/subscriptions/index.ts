


import { subscriptionPlanRouter } from "./subscription_plan";
import exprees from "express" ; 
import { userSusbcriptionRouter } from "./user_subscription";
const router = exprees.Router() ; 


router.use('/subscription_plan' , subscriptionPlanRouter) ; 
router.use('/user_subscription' , userSusbcriptionRouter) ; 

export { router as subscriptionRouter}

