
import express from "express";
import { propertyRouter } from "./property";
import { propertyTypeRouter } from "./property_type";
import { propertyTagRouter } from "./property_tags";
import { authMiddleware } from "../../middleware/auth";


const router = express.Router()

router.use("/property_type", propertyTypeRouter);
router.use("/property_tags", authMiddleware  as any, propertyTagRouter)

router.use("/", propertyRouter);

export {
    router as propertiesRouter
}