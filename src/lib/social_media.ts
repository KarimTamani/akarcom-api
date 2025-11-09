

import { z } from "zod";



export const socialMediaSchema = z.object({
  facebook: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
});


export type SocialMediaInput = z.infer<typeof socialMediaSchema>;

 