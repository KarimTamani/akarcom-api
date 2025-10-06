

import { z } from "zod";



export const socialMediaSchema = z.object({
  facebook: z.string().url().nullable().optional(),
  instagram: z.string().url().nullable().optional(),
  tiktok: z.string().url().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
});


export type SocialMediaInput = z.infer<typeof socialMediaSchema>;

 