


import express, { Request, Response } from "express";
import { ProjectUnitType, PropertyImageInput, PropertyInput, propertySchema, PropertyTagInput, PropertyUpdateInput, propertyUpdateSchema } from "../../lib/property";
import prisma from "../../../prisma/prisma";
import { authMiddleware } from "../../middleware/auth";
import { subscriptionMiddleware } from "../../middleware/subscription";
import { SubscriptionFeatures } from "../../lib/subscription";
import slugify from "slugify";
import { UserMiddleware } from "../../middleware/user-middleware";

const router = express.Router();

router.post("/",
    authMiddleware as any,
    subscriptionMiddleware(SubscriptionFeatures.properties) as any
    , async (request: Request<{}, {}, PropertyInput>, response: Response) => {
        try {
            const result = propertySchema.safeParse(request.body);
            if (!result.success) {
                response.status(400).json(result); return;
            }
            const { property_images, property_tags, project_units, ...propertInput } = result.data;
            (propertInput as PropertyInput).slug = slugify(propertInput.title, { lower: true, strict: true });
            const createdProperty = await prisma.$transaction(async (tx) => {

                return await tx.properties.create({
                    data: {
                        ...propertInput,
                        user_id: (request as any).user.id as any,
                        property_images: {
                            create: property_images
                        },
                        project_units: {
                            create: project_units as any
                        },
                        property_property_tags: {
                            create: property_tags.map((propertyTag: PropertyTagInput) => ({
                                property_tags: propertyTag.id ? {
                                    connect: { id: propertyTag.id }
                                } : {
                                    create: {
                                        name: propertyTag.name,
                                        user_id: (request as any).user.id as any
                                    }
                                }
                            }))
                        }
                    } as any,
                    include: {
                        property_images: true,
                        property_property_tags: {
                            include: {
                                property_tags: true,
                            }
                        },
                        project_units: true,
                    }
                })
            })


            response.status(200).json({ success: true, createdProperty });
        } catch (error) {
            console.log(error)
            response.status(500).json({ success: false, error });
        }
    });

router.put("/:id",
    authMiddleware as any,
    subscriptionMiddleware(SubscriptionFeatures.properties) as any
    , async (request: Request<{ id: string }, {}, PropertyUpdateInput>, response: Response) => {
        try {

            const id = Number(request.params.id);

            if (isNaN(id)) {
                response.status(400).json({ success: false, error: "Id is required" }); return;
            }

            const result = propertyUpdateSchema.safeParse(request.body);
            if (!result.success) {
                response.status(400).json(result); return;
            }

            const property = await prisma.properties.findUnique({
                where: { id },
                include: {
                    property_images: true,
                    property_property_tags: {
                        include: {
                            property_tags: true
                        }
                    },
                    project_units: true
                }
            });

            if (!property) {
                response.status(404).json({ success: false, error: "Property not found" }); return;
            }

            const { property_images, property_tags, project_units, ...propertyInput } = result.data;
            if (propertyInput.title) {
                (propertyInput as PropertyInput).slug = slugify(propertyInput.title, { lower: true, strict: true });
            }
            const updatedProperty = await prisma.$transaction(async (tx) => {

                const imagesToKeep: number[] | undefined = property_images?.filter((img: PropertyImageInput) => img.id).map((img: PropertyImageInput) => img.id);
                const imagesToDelete = imagesToKeep !== undefined ? property.property_images.filter((img) => !imagesToKeep.includes(img.id)) : undefined
                const updatedUnits: ProjectUnitType[] | undefined = project_units?.filter((unit) => unit.id);
                const updatedUnitesIds: number[] | undefined = updatedUnits?.map((unit) => unit.id)
                const deletedUnites: ProjectUnitType[] | undefined = updatedUnitesIds !== undefined ? property.project_units.filter((unit) => !updatedUnitesIds.includes(unit.id)) : undefined;

                // remove images 
                if (imagesToDelete?.length > 0)
                    await tx.property_images.deleteMany({
                        where: {
                            id: {
                                in: imagesToDelete.map((img) => img.id)
                            }
                        }
                    });

                let property_property_tags: any[] = [];
                if (property_tags !== undefined) {

                    // ---- Handle Tags (M2M) ----
                    // Clear old tags first (simpler and consistent)
                    await tx.property_property_tags.deleteMany({
                        where: { property_id: id },
                    });

                    // Recreate links (connect existing or create new)
                    property_property_tags = property_tags?.map(tag => ({
                        property_tags: tag.id
                            ? { connect: { id: tag.id } }
                            : { create: { name: tag.name, user_id: (request as any).user.id } },
                    })) || [];
                }
                return await tx.properties.update({
                    where: {
                        id
                    },
                    data: {
                        ...propertyInput,
                        property_images: {
                            create: property_images?.filter((img) => !img.id).map((img) => ({ image_url: img.image_url })) || []
                        },
                        property_property_tags: { create: property_property_tags },
                        project_units: {
                            update: updatedUnits?.map((unit) => ({
                                where: { id: unit.id },
                                data: unit
                            })),
                            create: project_units?.filter((unit) => !unit.id) as any || [],
                            deleteMany: deletedUnites?.map((unit) => ({ id: unit.id }))
                        }
                    },
                    include: {
                        property_images: true,
                        property_property_tags: {
                            include: { property_tags: true },
                        },
                        project_units: true
                    },
                })
            })

            response.status(200).json({ success: true, data: updatedProperty });

        } catch (error) {
            console.log(error);
            response.status(500).json({ success: false, error });
        }
    });


router.get("/area", async (request: Request, response: Response) => {
    try {


        const result = await prisma.properties.aggregate({
            _min: { area_sq_meters: true },
            _max: { area_sq_meters: true },
        });

        response.status(200).json({
            success: true,
            data: {
                min_area: Number(result._min.area_sq_meters),
                max_area: Number(result._max.area_sq_meters),
            }
        });

    } catch (error) {
        response.status(500).json({ success: false, error })
    }
})


router.get("/slug/:slug", UserMiddleware as any, async (request: Request, response: Response) => {
    try {
        const slug = request.params.slug;


        if (!slug) {
            response.status(401).json({ success: false, error: "Slug is required" }); return;
        }

        const property = await prisma.properties.findUnique({
            where: {
                slug
            },
            include: {
                property_images: true,
                property_property_tags: {
                    include: { property_tags: true },
                },

                favorites: {
                    where: {
                        user_id: (request as any).user?.id
                    },
                },
                users: {
                    include: { social_media: true }
                },
                project_units: true
            }
        });
        if (!property) {
            response.status(404).json({ success: false, error: "Property not found" }); return;
        }
        response.status(200).json({ success: true, data: property });

    } catch (error) {
        console.log(error)
        response.status(500).json({ success: false, error });
    }
});


router.get("/:id", UserMiddleware as any, async (request: Request, response: Response) => {
    try {
        const id = Number(request.params.id);

        if (isNaN(id)) {
            response.status(401).json({ success: false, error: "Id is required" }); return;
        }

        const property = await prisma.properties.findUnique({
            where: { id },
            include: {
                property_images: true,
                property_property_tags: {
                    include: { property_tags: true },
                },
                favorites: {
                    where: {
                        user_id: (request as any).user?.id
                    },
                },
                project_units: true
            }
        });
        if (!property) {
            response.status(404).json({ success: false, error: "Property not found" }); return;
        }
        response.status(200).json({ success: true, data: property });

    } catch (error) {
        console.log(error);
        response.status(500).json({ success: false, error });
    }
});


router.get("/", UserMiddleware as any, async (request: Request, response: Response) => {
    try {

        let {
            query = "",
            offset = "0",
            limit = '20',
            start_price,
            end_price,
            property_type_ids,
            ad_type,
            min_area,
            max_area,
            num_rooms,
            bethrooms,
            furnished,
            ownership_book,
            favorite,
            latitude,
            longitude,
            status,
            user_id,
            sort_by = "created_at"
        } = request.query;

        query = String(query).trim().split(" ").filter((str) => str != "").join(" ");


        let filters: any = {}

        if (start_price || end_price) {
            filters = {
                price: {}
            }
            if (start_price)
                filters.price.gte = start_price;
            if (end_price)
                filters.price.lte = end_price;
        }
        if (property_type_ids) {
            try {
                property_type_ids = JSON.parse(property_type_ids as string)
                if (Array.isArray(property_type_ids) && property_type_ids.length > 0)
                    filters = {
                        ...filters,
                        property_type_id: {
                            in: property_type_ids
                        }
                    }
            } catch (error) { }
        }
        if (ad_type) {
            try {
                ad_type = JSON.parse(ad_type as string);
                if (Array.isArray(ad_type) && ad_type.length > 0)
                    filters = {
                        ...filters,
                        add_type: {
                            in: ad_type
                        }
                    }
            } catch (error) { }
        }

        if (min_area || max_area) {
            filters = {
                area_sq_meters: {}
            }
            if (min_area)
                filters.area_sq_meters.gte = min_area;
            if (max_area)
                filters.area_sq_meters.lte = max_area;
        }

        if (num_rooms)
            filters = {
                ...filters,
                num_rooms: {
                    gte: parseInt(num_rooms as string)
                }
            }
        if (bethrooms)
            filters = {
                ...filters,
                bethrooms: {
                    gte: parseInt(bethrooms as string)
                }
            }
        if (furnished) {
            filters = {
                ...filters,
                furnished: JSON.parse(furnished as string)
            }
        }
        if (ownership_book) {
            filters = {
                ...filters,
                ownership_book: JSON.parse(ownership_book as string)
            }
        }

        if (status) {
            filters = {
                ...filters,
                status
            }
        }

        if (user_id) {
            filters = {
                user_id: JSON.parse(user_id as string)
            }
        }
        if (favorite == "true") {
            filters = {
                ...filters,
                favorites: {
                    some: { user_id: (request as any).user.id }
                }
            }
        }
        const where = {
            OR: [
                {
                    title: {
                        contains: query,
                        mode: "insensitive"
                    }
                },
                {
                    description: {
                        contains: query,
                        mode: "insensitive"
                    }
                },
                {
                    address: {
                        contains: query,
                        mode: "insensitive"
                    }
                },
                {
                    postal_code: {
                        contains: query,
                        mode: "insensitive"
                    }
                },
                {
                    city: {
                        contains: query,
                        mode: "insensitive"
                    }
                },
            ],
            ...filters,
        } as any

        if (sort_by == "created_at") {
            const [properties, count] = await prisma.$transaction([
                prisma.properties.findMany({
                    where,
                    skip: parseInt(offset as string),
                    take: parseInt(limit as string),
                    include: {
                        property_images: true,
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                picture_url: true
                            }
                        },
                        favorites: {
                            where: {
                                user_id: (request as any).user?.id
                            },

                        }
                    },
                    orderBy: {
                        created_at: "desc"
                    }
                }),
                prisma.properties.count({
                    where
                }),
            ])
            response.status(200).json({ success: true, count, data: properties }); return;
        } else if (sort_by == "distance") {

            let conditions: string[] = []
            let params: any[] = [] // for parameterized query

            // search query
            if (query) {
                const q = `%${query}%`
                conditions.push(`
                    (
                    p.title ILIKE ${params.push(q) && `$${params.length}`} OR
                    p.description ILIKE ${params.push(q) && `$${params.length}`} OR
                    p.address ILIKE ${params.push(q) && `$${params.length}`} OR
                    p.postal_code ILIKE ${params.push(q) && `$${params.length}`} OR
                    p.city ILIKE ${params.push(q) && `$${params.length}`}
                    )
                `)
            }

            // price range
            if (start_price || end_price) {
                if (start_price) {
                    conditions.push(`p.price >= ${params.push(parseFloat(start_price as string)) && `$${params.length}`}`)
                }
                if (end_price) {
                    conditions.push(`p.price <= ${params.push(parseFloat(end_price as string)) && `$${params.length}`}`)
                }
            }

            // property type
            if (property_type_ids?.length) {
                conditions.push(`p.property_type_id = ANY(${params.push(property_type_ids) && `$${params.length}`})`)
            }

            // ad type
            if (ad_type?.length) {
                conditions.push(`p.add_type = ANY(${params.push(ad_type as string) && `$${params.length}`}::properties_add_type_enum[]) `)
            }

            // area range
            if (min_area || max_area) {
                if (min_area) conditions.push(`p.area_sq_meters >= ${params.push(parseFloat(min_area as string)) && `$${params.length}`}`)
                if (max_area) conditions.push(`p.area_sq_meters <= ${params.push(parseFloat(max_area as string)) && `$${params.length}`}`)
            }

            // rooms / bathrooms
            if (num_rooms) conditions.push(`p.num_rooms >= ${params.push(parseInt(num_rooms as string)) && `$${params.length}`}`)
            if (bethrooms) conditions.push(`p.bethrooms >= ${params.push(parseInt(bethrooms as string)) && `$${params.length}`}`)

            // furnished / ownership
            if (furnished !== undefined) conditions.push(`p.furnished = ${params.push(furnished) && `$${params.length}`}::boolean`)
            if (ownership_book !== undefined) conditions.push(`p.ownership_book = ${params.push(ownership_book) && `$${params.length}`}::boolean`)

            // favorites only
            if (favorite === "true" && (request as any).user?.id) {
                conditions.push(`EXISTS (SELECT 1 FROM favorites f WHERE f.property_id = p.id AND f.user_id = ${params.push((request as any).user?.id) && `$${params.length}`})`)
            }
            if (status) {
                conditions.push(`p.status = '${status}'`)
            }
            // combine all
            const whereClause =
                conditions.length > 0
                    ? `WHERE ${conditions.join(" AND ")}`
                    : ""


            const lat = parseFloat(latitude as string);
            const lng = parseFloat(longitude as string);

            console.log(whereClause)
            const [properties, countResult] = await prisma.$transaction([
                prisma.$queryRawUnsafe(`
                    SELECT 
                        p.*,
                        (6371 * acos(
                        cos(radians(${lat})) * cos(radians(p.latitude)) *
                        cos(radians(p.longitude) - radians(${lng})) +
                        sin(radians(${lat})) * sin(radians(p.latitude))
                        )) AS distance,
                        json_agg(DISTINCT pi.*) AS property_images,
                        json_agg(DISTINCT f.*) ${(request as any).user?.id ? `FILTER (WHERE f.user_id = ${(request as any).user?.id}) AS favorites` : ""}
                    FROM properties p
                    LEFT JOIN property_images pi ON pi.property_id = p.id
                    LEFT JOIN favorites f ON f.property_id = p.id
                    ${whereClause}
                    GROUP BY p.id
                    ORDER BY distance ASC
                    LIMIT ${limit} OFFSET ${offset};
                `, ...params),

                prisma.$queryRawUnsafe(`
                    SELECT COUNT(*) AS total
                    FROM properties p
                    ${whereClause};
                `, ...params)
            ])


            const count = Number(countResult[0]?.total || 0);

            response.status(200).json({ success: true, count, data: properties }); return;
        }
    } catch (error) {
        response.status(500).json({ success: false, error });
    }
});



router.delete("/:id",
    authMiddleware as any,
    subscriptionMiddleware(SubscriptionFeatures.properties) as any
    , async (request: Request, response: Response) => {
        try {
            const id = Number(request.params.id);

            if (isNaN(id)) {
                response.status(401).json({ success: false, error: "Id is required" }); return;
            }
            try {
                await prisma.properties.delete({
                    where: {
                        id,
                        user_id: (request as any).user.id
                    }
                })
            } catch (error) {
                response.status(404).json({ success: false, error: "Property not found" }); return;
            }
            response.status(200).json({ success: true, data: id }); return;

        } catch (error) {
            response.status(500).json({ success: false, error });
        }
    });



router.put("/favorite/:id",
    authMiddleware as any,
    subscriptionMiddleware(SubscriptionFeatures.favorite) as any
    , async (request: Request<{ id: string }, {}, PropertyUpdateInput>, response: Response) => {
        try {

            const id = Number(request.params.id);

            if (isNaN(id)) {
                response.status(401).json({ success: false, error: "Id is required" }); return;
            }
            const property = await prisma.properties.findUnique({ where: { id } });

            if (!property) {
                response.status(404).json({ success: false, error: "Property not found" }); return;
            }

            let favorite = await prisma.favorites.findFirst({
                where: {
                    property_id: id,
                    user_id: (request as any).user?.id
                }
            });

            if (!favorite) {
                favorite = await prisma.favorites.create({
                    data: {
                        property_id: id,
                        user_id: (request as any).user?.id
                    }
                });
            }
            else {
                await prisma.favorites.deleteMany({
                    where: {
                        property_id: id,
                        user_id: (request as any).user?.id
                    }
                });
                favorite = null;
            }
            response.status(200).json({ success: true, data: favorite });
        } catch (error) {
            response.status(500).json({ success: false, error });
        }
    });



router.put("/view/:id", async (request: Request, response: Response) => {
    try {


        const id = Number(request.params.id);

        if (isNaN(id)) {
            response.status(401).json({ success: false, error: "Id is required" }); return;
        }
        const property = await prisma.properties.findUnique({ where: { id } });

        if (!property) {
            response.status(404).json({ success: false, error: "Property not found" }); return;
        }

        const updatedProperty = await prisma.properties.update({
            where: {
                id
            },
            data: {
                views: property.views + 1
            }
        });
        response.status(200).json({ success: true, data: updatedProperty });
    } catch (error) {
        response.status(500).json({ success: false, error });
    }
})


export {
    router as propertyRouter
}