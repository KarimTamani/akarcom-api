import Router, { Request, Response } from "express";
import prisma from "../../../prisma/prisma";
import { AuthenticatedRequest } from "../../middleware/auth";


const router = Router();


router.get("/", async (request : AuthenticatedRequest, response) => {
    try {

        const user_id = request.user.id ; 

        const property_tags = await prisma.property_tags.findMany({
            where : {
                OR : [
                    {  user_id : user_id} ,  
                    { is_approuved : true}
                ]
            }
        })

        response.status(200).json({
            success : true , 
            data : property_tags 
        })


    } catch (error) {
        response.status(500).json({
            success: false,
            error
        })
    }
})

export {
    router as propertyTagRouter
}