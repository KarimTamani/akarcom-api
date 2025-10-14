import { tickets_status_enum } from "@prisma/client";
import z from "zod" ; 




const ticketSchema = z.object({ 
    title : z.string() , 
    description : z.string() , 
}) ; 


const ticketEditSchema = z.object({
    title : z.string().optional() , 
    description : z.string().optional() , 
    answer : z.string().optional() , 
    status : z.enum(tickets_status_enum).optional()
})  ; 


export type ticketInput = z.infer<typeof ticketSchema> ; 
export type ticketUpdateInput = z.infer<typeof ticketEditSchema> ; 


export { 
    ticketSchema , 
    ticketEditSchema 
}