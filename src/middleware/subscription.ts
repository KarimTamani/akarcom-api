import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import prisma from "../../prisma/prisma";
import { user_subscriptions_status_enum, users_user_type_enum } from "@prisma/client";
import { SubscriptionFeatures } from "../lib/subscription";
import { addMonths } from "../utils/time";



export function subscriptionMiddleware(...accessFeatures) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;

        if (user.user_type == users_user_type_enum.admin || user.user_type == users_user_type_enum.employee) {
            next();
            return;
        }
        let user_subscription = await prisma.user_subscriptions.findFirst({
            where: {
                user_id: user.id as any,
                status: user_subscriptions_status_enum.active
            },
            orderBy: {
                created_at: "desc"
            }
        })
        let subscription_plan: any | undefined;
        if (!user_subscription) {

            subscription_plan = await prisma.subscription_plans.findFirst({
                where: {
                    price: 0
                }
            });

            if (!subscription_plan)
                return res.status(403).json({ error: 'Anauthorized no subscription found' });

            const endDate = addMonths(new Date(), 1);
            user_subscription = await prisma.user_subscriptions.create({
                data: {

                    user_id: (req as any).user.id,
                    end_date: endDate,
                    start_date: new Date(),
                    plan_id: subscription_plan.id,
                    status: user_subscriptions_status_enum.active , 
                    proof_of_payment : ""
                } as any
            }) 

        }
        else
            subscription_plan = await prisma.subscription_plans.findUnique({ where: { id: user_subscription.plan_id } });

        if (Number(subscription_plan.price) != 0) {
            const currentDate = new Date();
            currentDate.setMonth(currentDate.getMonth() + 1)
            if (currentDate >= user_subscription.end_date) {
                return res.status(403).json({ error: 'Susbcription expired' });
            }
        }

        accessFeatures = accessFeatures as string[];

        if (!subscription_plan.features)
            return res.status(403).json({ error: 'Your plan does not have any allwoed features' });

        const subscriptionPlanFeatures = subscription_plan.features as string[];

        if (accessFeatures.includes(SubscriptionFeatures.properties)) {

            if (!subscriptionPlanFeatures.includes(SubscriptionFeatures.properties as any))
                return res.status(403).json({ error: 'Not allowed to post proprties' });

            const numOfProprieties = await prisma.properties.count({
                where: {
                    user_id: user.id
                }
            });

            if (Number(numOfProprieties) >= subscription_plan.max_properties) {
                return res.status(403).json({ error: 'Max proprities reached' });
            }
        }

        if (accessFeatures.includes(SubscriptionFeatures.tickets)) {


            if (!subscriptionPlanFeatures.includes(SubscriptionFeatures.tickets)) {
                return res.status(403).json({ error: 'Not allowed to access tickets' });
            }
        }


        if (accessFeatures.includes(SubscriptionFeatures.faqs)) {
            if (!subscriptionPlanFeatures.includes(SubscriptionFeatures.faqs)) {
                return res.status(403).json({ error: 'Not allowed to access FAQs' });
            }
        }


        if (accessFeatures.includes(SubscriptionFeatures.chat)) {
            if (!subscriptionPlanFeatures.includes(SubscriptionFeatures.chat)) {
                return res.status(403).json({ error: 'Not allowed to access chat' });
            }
        }

        if (accessFeatures.includes(SubscriptionFeatures.favorite)) {
            if (!subscriptionPlanFeatures.includes(SubscriptionFeatures.favorite)) {
                return res.status(403).json({ error: 'Not allowed to access favorite' });
            }
        }

        next();
    }

}
