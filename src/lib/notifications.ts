import z from "zod";

export const notificationSettingsSchema = z.object({
    messages : z.boolean().default(true) , 
    ads : z.boolean().default(true)
}) ; 

export type NotificationSettingInput = z.infer<typeof notificationSettingsSchema>;

 
