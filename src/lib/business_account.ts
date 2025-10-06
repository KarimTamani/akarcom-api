import { z } from "zod";

export const businessAccountSchema = z.object({
  cover_picture_url: z.string().url().nullable().optional(), // String? => null or undefined allowed, must be a URL if provided
  agency_name: z.string(),                                   // required
  registration_number: z.string().nullable().optional(),     // String? => null or undefined allowed
  business_address: z.string(),                              // required
});

export type businessAccountInput = z.infer<typeof businessAccountSchema>;