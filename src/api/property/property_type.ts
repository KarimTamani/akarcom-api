


import express, { Request, Response } from "express";
import { PropertyTypeInput, propertyTypeSchema, PropertyTypeUpdateInput, propertyTypeUpdateSchema } from "../../lib/property";
import prisma from "../../../prisma/prisma";
import { users_user_type_enum } from "@prisma/client";
import { authorize } from "../../middleware/authorize";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();

router.post("/",
    authMiddleware as any , 
    authorize(users_user_type_enum.employee, users_user_type_enum.admin)
    , async (request: Request<{}, {}, PropertyTypeInput>, response: Response) => {
        try {
            const result = propertyTypeSchema.safeParse(request.body);

            if (!result.success) {
                response.status(401).json(result); return;
            }
            const { data } = result;

            if (data.parent_id) {
                const parentType = await prisma.property_types.findUnique({ where: { id: data.parent_id } });
                if (!parentType) {
                    response.status(401).json({ success: false, error: "Parent id not found" }); return;
                }
            }

            const newPropertyType = await prisma.property_types.create({ data });

            response.status(200).json({ success: true, data: newPropertyType });

        } catch (error) {
            response.status(500).json({ success: false, error });
        }
    });

router.put("/:id", 
    authMiddleware as any ,
    authorize(users_user_type_enum.employee, users_user_type_enum.admin)
    
    , async (request: Request<{ id: string }, {}, PropertyTypeUpdateInput>, response: Response) => {
    try {

        const id = Number(request.params.id);

        if (isNaN(id)) {
            response.status(401).json({ success: false, error: "Id is required" });
        }

        const result = propertyTypeUpdateSchema.safeParse(request.body);

        if (!result.success) {
            response.status(401).json(result);
        }

        const { data } = result;
        const updatedType = await prisma.property_types.update({
            where: {
                id
            },
            data
        });
        response.status(200).json({ sucess: false, data: updatedType });
    } catch (error) {
        response.status(500).json({ success: false, error });
    }
});

router.get("/", async (request: Request, response: Response) => {
    try {
        const types = await prisma.property_types.findMany({
            where: {
                parent_id: null
            },
            include: {
                other_property_types: true
            },
            orderBy: {
                id: "desc"
            }
        })
        response.status(200).json({ success: true, data: types })
    } catch (error) {
        response.status(500).json({ success: false, error });
    }
});

router.delete("/:id", 
    authMiddleware as any ,
    authorize(users_user_type_enum.employee, users_user_type_enum.admin)
    , async (request: Request, response: Response) => {
    try {

        const id = Number(request.params.id);
        if (isNaN(id)) {
            response.status(401).json({ success: false, error: "Id is required" });
        }
        try {
            await prisma.property_types.delete({ where: { id } });
        } catch (error) {
            response.status(401).json({ success: false, error: "Cannot delete this property type" }); return;
        }

        response.status(200).json({ success: true, data: id })

    } catch (error) {
        response.status(500).json({ success: false, error });
    }
});

export {
    router as propertyTypeRouter
}