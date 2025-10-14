
import express  from "express" ; 
import { propertyRouter } from "./property";
import { propertyTypeRouter } from "./property_type";


const router = express.Router()

router.use("/property_type" , propertyTypeRouter)  ;
router.use("/" , propertyRouter)  ;

export { 
    router as propertiesRouter 
}