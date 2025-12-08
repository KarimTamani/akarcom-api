
import express, { Request, Response } from 'express';
import prisma from '../../../prisma/prisma';
import { properties_status_enum } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import { User, UserType } from '../../lib/user';


const router = express.Router();

function isValidDate(value: any): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
}

router.get('/', async (request: AuthenticatedRequest, response: Response) => {
    try {
        let {
            start_date,
            end_date
        } = request.query;

        let startDate: Date;
        let endDate: Date;

        const user: User = request.user;

        if (start_date && !isValidDate(start_date)) {
            response.status(400).json({ success: false, message: "Start date is not valid date" });
            return
        }
        else if (start_date) {
            startDate = new Date(start_date as string)
        }

        if (end_date && !isValidDate(end_date)) {
            response.status(400).json({ success: false, message: "Start date is not valid date" });
            return
        }
        else if (end_date) {
            endDate = new Date(end_date as string)
        }
        const isUser = user.user_type == UserType.individual || user.user_type == UserType.agency || user.user_type == UserType.developer;
        const stats = await prisma.$transaction(async (tx) => {

            let currentFilter: any = {};
            let previousFilter: any | undefined;
            if (startDate) {
                currentFilter = {
                    gt: startDate
                }
            }
            if (endDate) {
                currentFilter = {
                    lte: endDate
                }
            };

            if (startDate && endDate) {
                // difference in milliseconds
                const diff = startDate.getTime() - endDate.getTime();

                // previous period
                const prevStart = new Date(startDate.getTime() - diff);
                const prevEnd = new Date(endDate.getTime() - diff);

                previousFilter = {
                    gt: prevStart,
                    lte: prevEnd
                }
            }

            let whereCase: any = {
                created_at: currentFilter,
            }

            if (isUser) {
                whereCase = {
                    ...whereCase,
                    user_id: user.id
                }
            }

            const pending_properties = await tx.properties.count({
                where: {
                    ...whereCase,
                    status: properties_status_enum.draft,

                }
            });
            let previous_pending;
            let previous_messages;

            if (previousFilter) {
                previous_pending = await tx.properties.count({
                    where: {
                        ...whereCase,
                        status: properties_status_enum.draft,
                        created_at: previousFilter
                    }
                });
            }


            const pending_messages = await tx.messages.count({
                where: {
                    sent_at: currentFilter,
                    receiver_id: user.id,
                    read_at: { equals: null }
                }
            })

            if (previousFilter) {
                previous_messages = await tx.messages.count({
                    where: {
                        sent_at: previousFilter,
                        receiver_id: user.id,
                        read_at: { equals: null }
                    }
                })
            }

            let new_properties = undefined;

            if (!isUser) {

                const grouped = await tx.properties.groupBy({
                    by: ['property_type_id'],
                    _count: { id: true },
                });

                const types = await tx.property_types.findMany({});
                new_properties = grouped.map(g => ({
                    property_type_id: g.property_type_id,
                    count: g._count.id,
                    type: types.find(t => t.id === g.property_type_id)
                }));

            }

            return {
                pending_properties,
                pending_messages,
                previous_pending,
                previous_messages,
                new_properties: new_properties,

            }
        })

        response.status(200).json({ success: true, data: stats });

    } catch (error) {
        console.log(error)
        response.status(500).json({ success: false, error })
    }
})


router.get('/general', async (request: AuthenticatedRequest, response: Response) => {
    try {

        let {
            start_date,
            end_date
        } = request.query;

        let startDate: Date;
        let endDate: Date;

        const user: User = request.user;

        if (!start_date || !isValidDate(start_date) || !end_date && !isValidDate(end_date)) {
            response.status(400).json({ success: false, message: "Date interval is required" });
            return
        }

        startDate = new Date(start_date as string)
        endDate = new Date(end_date as string)

        const diff = startDate.getTime() - endDate.getTime();

        // previous period
        const prevStart = new Date(startDate.getTime() - diff);
        const prevEnd = new Date(endDate.getTime() - diff);

        const stats = await prisma.$transaction(async (tx) => {
            const user_count = await tx.users.count({
                where: {
                    created_at: {
                        gt: startDate,
                        lte: endDate
                    }
                }
            });
            const current_properties = await tx.properties.findMany({
                where: {
                    created_at: {
                        gt: startDate,
                        lte: endDate
                    }
                },
                select: {
                    id: true,
                    created_at: true,
                    views: true
                }
            });
            const previous_properties = await tx.properties.findMany({
                where: {
                    created_at: {
                        gt: prevStart,
                        lte: prevEnd
                    }
                },
                select: {
                    id: true,
                    created_at: true,
                    views: true
                }
            })

            const current_subscriptions = await tx.user_subscriptions.findMany({
                where: {
                    created_at: {
                        gt: startDate,
                        lte: endDate
                    }
                },
                select: {
                    created_at: true,
                    total_amount: true,
                }
            })


            const previous_subscriptions = await tx.user_subscriptions.findMany({
                where: {
                    created_at: {
                        gt: prevStart,
                        lte: prevEnd
                    }
                },
                select: {
                    created_at: true,
                    total_amount: true,
                }
            })

            return {
                user_count,
                current_properties,
                previous_properties, 
                current_subscriptions , 
                previous_subscriptions
            }
        });
        response.status(200).json({ success: true, data: stats });
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
})



export { router as analyticsRouter }