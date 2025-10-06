import { user_subscriptions_status_enum } from "@prisma/client";
import z from "zod";

const subscriptionPlanSchema = z.object({
    name : z.string().min(1 , "Subscirption plan name is required") ,   
    description : z.string().optional().nullable(), 
    price : z.number().min(0 , "Price needs to be positive").default(0), 
    max_properties : z.number().min(1 , "At least one Property").default (1).optional() , 
    features : z.json().optional().nullable() , 
})

const userSubscriptionSchema = z.object({
    plan_id : z.number()  ,   
    payment_details : z.string().optional().nullable(), 
    payment_method : z.enum(["baridimob", "bank_transfer", "e_payment"]), 
    proof_of_payment : z.string().url() , 
    period : z.number().default(1),
    start_date : z.date().default(new Date())
}); 



const userSubscriptionUpdateSchema = z.object({
    payment_details : z.string().optional().nullable(), 
    status : z.enum(user_subscriptions_status_enum).optional()
})


const subscriptionPlanUpdateSchema = subscriptionPlanSchema.partial();

export type SubscriptionPlanInput  = z.infer<typeof subscriptionPlanSchema> ; 
export type SubscriptionPlanUpdateInput  = z.infer<typeof subscriptionPlanUpdateSchema> ; 
export type UserSubscriptionInput  = z.infer<typeof userSubscriptionSchema>
export type UserSubscriptionUpdateInput = z.infer<typeof userSubscriptionUpdateSchema> ; 

export {
    subscriptionPlanSchema , 
    subscriptionPlanUpdateSchema , 
    userSubscriptionSchema , 
    userSubscriptionUpdateSchema
}