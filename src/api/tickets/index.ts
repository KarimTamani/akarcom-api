
import express, { Request, Response } from "express";
import { ticketEditSchema, ticketInput, ticketSchema, ticketUpdateInput } from "../../lib/ticket";
import prisma from "../../../prisma/prisma";
import { authorize } from "../../middleware/authorize";
import { users_user_type_enum } from "@prisma/client";
import { subscriptionMiddleware } from "../../middleware/subscription";
import { SubscriptionFeatures } from "../../lib/subscription";


const router = express.Router();



router.post('/' , subscriptionMiddleware(SubscriptionFeatures.tickets) as any
, async (request: Request<{}, {}, ticketInput>, response: Response) => {
    try {

        const result = ticketSchema.safeParse(request.body);
        if (!result.success) {
            response.status(401).json(result); return;
        }

        const { data } = result;

        const ticket = await prisma.tickets.create({
            data: {
                ...data,
                user_id: (request as any).user.id
            }
        });
        response.status(200).json({ success: true, data: ticket })
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
});


router.put('/:id',
    authorize(users_user_type_enum.employee, users_user_type_enum.admin),
    async (request: Request<{ id: string }, {}, ticketUpdateInput>, response: Response) => {
        try {
            const id = Number(request.params.id);
            if (isNaN(id)) {
                response.status(404).json({ success: false, error: "Ticket not found" }); return;
            }

            const result = ticketEditSchema.safeParse(request.body);

            if (!result.success) {
                response.status(401).json(result); return;
            }

            const { data } = result;

            const updatedTicket = await prisma.tickets.update({
                where: {
                    id
                },
                data: {
                    ...data,
                    replier_id: (request as any).user.id
                }
            });
            response.status(200).json({ success: true, data: updatedTicket })
        } catch (error) {
            response.status(500).json({ success: false, error })
        }
    });


router.get('/:id' , async (request: Request, response: Response) => {
    try {
        const id = Number(request.params.id);
        if (isNaN(id)) {
            response.status(404).json({ success: false, error: "Ticket not found" }); return;
        }
        const ticket = await prisma.tickets.findUnique({
            where: {
                id
            },
            include: {
                user: true,
                replier: true
            }
        });

        response.status(200).json({ success: true, data: ticket });
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
});


router.get('/', subscriptionMiddleware(SubscriptionFeatures.faqs) as any, async (request: Request, response: Response) => {
    try {

        let {
            query = "",
            offset = '0',
            limit = '20',
            status
        } = request.query;

        query = String(query).trim().split(" ").filter((str) => str != "").join("");

        let filter = {};

        if (status) {
            filter = {
                status
            }
        }
        const tickets = await prisma.tickets.findMany({
            where: {
                OR: [
                    {
                        user: {
                            full_name: {
                                contains: query,
                                mode: "insensitive"
                            },
                            email: {
                                contains: query,
                                mode: "insensitive"
                            },
                        }
                    },
                    {
                        title: {
                            contains: query,
                            mode: "insensitive"
                        },

                    }, {
                        description: {
                            contains: query,
                            mode: "insensitive"
                        },
                    }, {
                        answer: {
                            contains: query,
                            mode: "insensitive"

                        }
                    }
                ],
                ...filter
            },
            skip: parseInt(offset as string),
            take: parseInt(limit as string),
            include: {
                user: true,
                replier: true
            }
        })
        response.status(200).json({ success: true, data: tickets });
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
});

export {
    router as ticketRouter
}