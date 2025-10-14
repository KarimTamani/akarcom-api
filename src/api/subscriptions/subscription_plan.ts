

import express, { Request, Response } from "express"
import { SubscriptionPlanInput, subscriptionPlanSchema, SubscriptionPlanUpdateInput, subscriptionPlanUpdateSchema } from "../../lib/subscription";
import prisma from "../../../prisma/prisma";
import { authorize } from "../../middleware/authorize";
import { users_user_type_enum } from "@prisma/client";
const router = express.Router();

router.post('/',
    authorize( users_user_type_enum.admin)
    , async (request: Request<{}, {}, SubscriptionPlanInput>, response: Response) => {
        try {

            const result = subscriptionPlanSchema.safeParse(request.body);
            if (!result.success) {
                response.status(400).json({
                    success: false,
                    error: result.error
                });
                return;
            }

            const createdSubscriptionPlan = await prisma.subscription_plans.create({
                data: result.data
            });

            response.status(200).json({
                success: true,
                data: createdSubscriptionPlan
            })
        } catch (error) {
            response.status(400).json({
                success: false,
                error
            })
        }
    })


router.put('/:id',
    authorize(users_user_type_enum.individual)
    , async (request: Request<{ id: string }, {}, SubscriptionPlanUpdateInput>, response: Response) => {
        try {

            const result = subscriptionPlanUpdateSchema.safeParse(request.body);
            const id = Number(request.params.id);

            if (isNaN(id)) {
                response.status(400).json({
                    success: false,
                    message: "Id needs to be an integer",
                });
                return;
            }
            if (!result.success) {
                response.status(400).json({
                    success: false,
                    error: result.error
                });
                return;
            }

            const oldPlan = await prisma.subscription_plans.findUnique({
                where: {
                    id
                }
            })

            if (!oldPlan) {
                response.status(404).json({
                    success: false,
                    error: "Subscription plan not found!"
                });
                return;
            }

            const updatedSubscirptionPlan = await prisma.subscription_plans.update({
                where: {
                    id
                },
                data: result.data
            });

            response.status(200).json({
                success: true,
                data: updatedSubscirptionPlan
            })


        } catch (error) {
            response.status(400).json({
                success: false,
                error
            })
        }
    });


router.get('/', async (request: Request, response: Response) => {
    try {
        let {
            query,
            offset = "0",
            limit = "20",
        } = request.query;

        let filters: any = {};
        if (!query || String(query).trim().length == 0)
            query = "";
        else
            query = String(query).trim().split(' ').filter((str: string) => str != "").join(" ");


        filters = {
            where: {
                OR: [{
                    name: {
                        contains: query,
                        mode: "insensitive"
                    }
                }, {
                    description: {
                        contains: query,
                        mode: "insensitive"
                    }
                }]
            },
            skip: parseInt(offset as string),
            take: parseInt(limit as string),

        }
        const subscription_plans = await prisma.subscription_plans.findMany(filters);
        response.status(200).json({
            success: true,
            data: subscription_plans
        })

    } catch (error) {
        response.status(400).json({
            success: false,
            error
        })
    }
});



router.delete("/:id",
    authorize(users_user_type_enum.admin)
    , async (request: Request, response: Response) => {
        try {

            const id = Number(request.params.id);

            if (isNaN(id)) {
                response.status(400).json({
                    success: false,
                    message: "Id needs to be an integer",
                });
                return;
            }
            try {

                await prisma.subscription_plans.delete({ where: { id } });

            } catch (error) {
                response.status(404).json({
                    success: false,
                    message: "Not found"
                });
                return;
            }
            response.status(200).json({
                success: false,
                data: {
                    id
                }
            })

        } catch (error) {
            response.status(400).json({
                success: false,
                error
            })
        }
    })

export { router as subscriptionPlanRouter }