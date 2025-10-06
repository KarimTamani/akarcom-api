

import express, { Request, Response } from "express";
import { UserSubscriptionInput, userSubscriptionSchema, UserSubscriptionUpdateInput, userSubscriptionUpdateSchema } from "../../lib/subscription";
import prisma from "../../../prisma/prisma";
import { addMonths } from "../../utils/time";
import { payment_method_enum, user_subscriptions_status_enum } from "@prisma/client";

const router = express.Router();


router.post('/', async (request: Request<{}, {}, UserSubscriptionInput>, response: Response) => {
    try {

        const result = userSubscriptionSchema.safeParse(request.body);

        if (!result.success) {
            response.status(400).json(result);
        }

        const { data } = result;
        const subscription_plan = await prisma.subscription_plans.findUnique({ where: { id: data.plan_id } });

        if (!subscription_plan) {
            response.status(401).json({ success: false, error: "No plan found" }); return;
        }

        const endDate = addMonths(data.start_date, data.period);
        delete data.period;

        const userSubscription = await prisma.user_subscriptions.create({
            data: {
                ...data,
                user_id: (request as any).user.id,
                end_date: endDate,
                status: user_subscriptions_status_enum.inactive
            }
        })

        response.status(200).json({
            success: true,
            data: userSubscription
        })
    } catch (error) {
        response.status(500).json({
            success: false,
            error
        })
    }
});

router.put('/:id', async (request: Request<{ id: string }, {}, UserSubscriptionUpdateInput>, response: Response) => {
    try {


        const id = Number(request.params.id);
        if (isNaN(id)) {
            response.status(401).json({ success: false, error: "Id is required" }); return;
        }

        const result = userSubscriptionUpdateSchema.safeParse(request.body);

        if (!result.success) {
            response.status(401).json(result); return;
        }

        let userSubscription = await prisma.user_subscriptions.findUnique({ where: { id } })

        if (!userSubscription) {
            response.status(401).json({ success: false, error: "User subscription not found" }); return;
        }

        const { data } = result;

        userSubscription = await prisma.user_subscriptions.update({
            where: {
                id
            },
            data
        });

        response.status(200).json({
            sucess: true,
            data: userSubscription
        })


    } catch (error) {
        response.status(500).json({
            success: false,
            error
        })
    }
});


router.get('/', async (request: Request, response: Response) => {
    try {
        let {
            query = "",
            payment_method,
            plan_id,
            status,
            start_date,
            end_date,
            offset = "0",
            limit = "20",
        } = request.query;

        query = String(query).trim().split(" ").filter((str: string) => str != "").join(" ");

        let filters = {};

        if (payment_method && Object.values(payment_method_enum).includes(String(payment_method) as payment_method_enum))
            filters = {
                payment_method
            }

        if (plan_id)
            filters = {
                ...filters, plan_id: parseInt(String(plan_id))
            }

        if (status && Object.values(user_subscriptions_status_enum).includes(String(status) as user_subscriptions_status_enum))
            filters = {
                ...filters,
                status
            }

        if (start_date) {
            filters = {
                ...filters,
                start_date: {
                    gte: new Date(start_date as string)
                }
            }
        }
        if (end_date) {
            filters = {
                ...filters,
                end_date: {
                    lte: new Date(end_date as string)
                }
            }
        }

        const [userSubscriptions, count] = await prisma.$transaction([

            prisma.user_subscriptions.findMany({
                where: {
                    users: {
                        OR: [
                            { full_name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                            { phone_number: { contains: query, mode: "insensitive" } },
                        ]
                    },
                    ...filters
                },
                skip: parseInt(offset as string),
                take: parseInt(limit as string),
                include: {
                    users: true
                }
            }),

            prisma.user_subscriptions.count({
                where: {
                    users: {
                        OR: [
                            { full_name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                            { phone_number: { contains: query, mode: "insensitive" } },
                        ]
                    },
                    ...filters
                },

            }),
        ])
        response.status(200).json({
            success: true,
            count,
            data: userSubscriptions
        })

    } catch (error) {
        response.status(400).json({
            success: false,
            error
        })
    }

});




export {
    router as userSusbcriptionRouter
}