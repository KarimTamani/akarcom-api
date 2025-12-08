import { properties_add_type_enum, properties_rent_period_enum, properties_status_enum } from "@prisma/client";
import z from "zod";

const propertyTypeSchema = z.object({
    name: z.string().min(1, "Property type name is required"),
    name_fr: z.string().min(1, "Property type name fr is required"),
    name_ar: z.string().min(1, "Property type name is required"),
    parent_id: z.number().optional().nullable()
});

const propertyTypeUpdateSchema = z.object({
    name: z.string().min(1, "Property type name is required"),
});

const propertyTagSchema = z.object({
    id: z.number().optional(),
    name: z.string().optional(),
});

const propertyImageSchema = z.object({
    id: z.number().optional(),
    image_url: z.string().url()
})

const projectUnitSchema = z.object({
    id: z.number().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    num_unites: z.number().min(1, "At least one property").optional(),

})
const propertySchema = z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    image_360_url: z.string().url().nullable().optional(),
    property_type_id: z.number(),
    condition: z.enum(["1", "2", "3", '4', "5"]).optional().default("3"),
    status: z.enum(properties_status_enum).nullable().optional(), // adjust values to match your enum
    add_type: z.enum(properties_add_type_enum).nullable().optional(), // adjust to your enum values
    rent_period: z.enum(properties_rent_period_enum).default("monthly").nullable().optional(),
    price: z.number().min(0, "Price must be positive"),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postal_code: z.string().optional().nullable(),
    area_sq_meters: z.number().nullable().optional(),
    num_rooms: z.number().optional().nullable(),
    bethrooms: z.number().optional().nullable(),
    furnished: z.boolean().default(true),
    schools: z.number().nullable().optional(),
    mosques: z.number().nullable().optional(),
    project_plan: z.string().url().optional().nullable(),
    ownership_book: z.boolean().nullable().optional(),
    property_images: z.array(propertyImageSchema).min(0, "At least one tag is required"),
    property_tags: z.array(propertyTagSchema).optional().nullable(),
    project_units: z.array(projectUnitSchema).optional().nullable(),
});





const propertyUpdateSchema = propertySchema.partial();

export type PropertyTypeInput = z.infer<typeof propertyTypeSchema>
export type PropertyTypeUpdateInput = z.infer<typeof propertyTypeUpdateSchema>;

export type PropertyInput = z.infer<typeof propertySchema> & {
    slug: string
};;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema> & {
    slug: string
};;

export type PropertyImageInput = z.infer<typeof propertyImageSchema>;
export type PropertyTagInput = z.infer<typeof propertyTagSchema>

export type ProjectUnitType = z.infer<typeof projectUnitSchema>;
export {
    propertyTypeSchema,
    propertyTypeUpdateSchema,
    propertySchema,
    propertyUpdateSchema
}
