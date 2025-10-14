




import z from "zod";



const messageSchema = z.object({
    receiver_id: z.number(),
    property_id: z.number().optional().nullable(),
    content: z.string().min(1, "Message is required"),
}) ; 


export type MessageInput = z.infer<typeof messageSchema> ;     

export { 
    messageSchema  
}