import express, { Request, Response } from 'express';
import prisma from '../../../prisma/prisma';
import { AuthPayload, CreateUserInput, createUserSchema, EditUserInput, editUserSchema, ResetPasswordInput, resetPasswordSchema, User, UserType } from '../../lib/user';
import { compare, hash } from 'bcryptjs';
import { createToken } from '../../utils/jwt';
import { NotificationSettingInput, notificationSettingsSchema } from '../../lib/notifications';
import { authorize } from '../../middleware/authorize';
import { users_user_type_enum } from '@prisma/client';

const router = express.Router();


router.get("/:id", async (request: Request, response: Response) => {

    try {
        const id = Number(request.params.id);

        if (isNaN(id)) {
            response.status(400).json({
                success: false,
                message: "Id needs to be an integer",
            });
            return;
        }

        const user = await prisma.users.findUnique({ where: { id } })
        delete user.password_hash;

        if (!user) {
            response.status(404).json({
                success: false,
                message: "Not found",
            });
            return;
        }

        response.status(200).json({
            success: true,
            data: user

        })
    } catch (error) {
        response.status(400).json({
            success: false,
            message: error,
        })
    }

});

router.get("/",
    authorize(users_user_type_enum.admin, users_user_type_enum.employee),
    async (request: Request, response: Response) => {
        try {

            let {
                query,
                user_type,
                offset = "0",
                limit = "20",
            } = request.query;

            let filters: any = {};

            if (!query || String(query).trim().length == 0)
                query = "";
            else
                query = String(query).trim().split(' ').filter((str: string) => str != "").join(" ");

            filters = {
                where: {
                    OR: [{
                        full_name: {
                            contains: query,
                            mode: "insensitive"
                        }
                    }, {
                        phone_number: {
                            contains: query,
                            mode: "insensitive"
                        }
                    }, {
                        email: {
                            contains: query,
                            mode: "insensitive"
                        }
                    }]
                },
            }
            if (user_type) {
                filters.where = {
                    user_type: {
                        in: JSON.parse(user_type as string)
                    },
                    ...filters.where
                }
            }
            const [users, count] = await prisma.$transaction([
                prisma.users.findMany({
                    where: filters.where,
                    skip: parseInt(offset as string),
                    take: parseInt(limit as string),

                    orderBy: {
                        created_at: "desc"
                    }
                }),
                prisma.users.count({
                    where: filters.where
                }),
            ])


            response.status(200).json({
                success: true,
                count,
                data: users
            })
        } catch (error) {
            response.status(400).json({
                success: false,
                message: error,

            })

        }
    });


router.put("/", async (request: Request<{}, {}, EditUserInput>, response: Response) => {
    try {
        const result = editUserSchema.safeParse(request.body);

        if (!result.success) {
            response.status(400).json({
                success: false,
                message: result.error,
            });
            return;
        }


        const user: User = (request as any).user
        const { social_media, business_accounts, ...userToUpdate } = result.data

        const oldSocialMedia = await prisma.social_media.findUnique({ where: { user_id: user.id } });
        const oldBusinessAccount = await prisma.business_accounts.findUnique({ where: { user_id: user.id } });

        const updatedUser = await prisma.$transaction(async (tx) => {


            if (!oldSocialMedia && social_media) {
                await tx.social_media.create({
                    data: {
                        user_id: user.id,
                        ...social_media
                    }
                })
            } else if (social_media) {

                await tx.social_media.update({
                    where: {
                        id: oldSocialMedia.id
                    },
                    data: social_media
                })
            }

            if (business_accounts && (user.user_type == UserType.agency || user.user_type == UserType.developer || user.user_type == UserType.admin)) {
                    
                if (!oldBusinessAccount) { 
                    
                    await tx.business_accounts.create({
                        data: {
                            user_id: user.id,
                            ...business_accounts
                        }
                    })
                } else {
                    await tx.business_accounts.update({
                        where: {
                            id: oldBusinessAccount.id
                        },
                        data: business_accounts
                    })
                }
            }


            const updatedUser = await tx.users.update({
                where: {
                    id: user.id
                },
                data: userToUpdate,
                include: {
                    social_media: true,
                    business_accounts: true
                }
            });
            return updatedUser;
        })
        response.status(200).json({
            success: true,
            data: updatedUser

        })
    } catch (error) {
        response.status(400).json({
            success: false,
            message: error,
        })
    }
})



router.post("/", async (request: Request<{}, {}, CreateUserInput>, response: Response) => {
    try {

        const result = createUserSchema.safeParse(request.body);

        if (!result.success) {
            response.status(400).json(result); return;
        }

        const { password, confirm_password, ...userInput } = <any>result.data;
        userInput.password_hash = await hash(password, 10);

        // create the user 
        const user: any = await prisma.users.create({ data: userInput });
        delete user.password_hash


        response.status(200).json({
            success: true,
            data: user
        });
        return;


    } catch (errors) {
        response.status(401).json({ errors });
        return;
    }
});



router.put("/password", async (request: Request<{}, {}, ResetPasswordInput>, response: Response) => {
    try {
        const result = resetPasswordSchema.safeParse(request.body);

        if (!result.success) {
            response.status(400).json({
                success: false,
                message: result.error,
            });
            return;
        }

        const user = (request as any).user;

        if (!(await compare(result.data.old_password, user.password_hash))) {
            response.status(400).json({
                success: false,
                message: "Incorrect Password",
            });
            return;
        }
        const updatedUser = await prisma.users.update({
            where: {
                id: user.id
            },
            data: {
                password_hash: await hash(result.data.new_password, 10)
            }
        });
        // create jwt token based in the email and password
        const token: string = await createToken(user.email, updatedUser.password_hash);

        delete user.password_hash
        // in case every thing when well , create and auth payload and return it to the client 
        const authPayload: AuthPayload = {
            user,
            token
        }
        response.status(200).json({
            success: true,
            data: authPayload
        })
    } catch (error) {
        response.status(400).json({
            success: false,
            message: error,
        })
    }
});

router.put('/notification-settings', async (request: Request<{}, {}, NotificationSettingInput>, response: Response) => {
    try {
        const result = notificationSettingsSchema.safeParse(request.body);
        if (!result.success) {
            response.status(400).json({
                success: false,
                message: result.error,
            });
            return;
        }

        const user = (request as any).user;

        const oldSettings = await prisma.notification_settings.findUnique({
            where: {
                user_id: user.id
            }
        });
        let updatedSetting;
        if (!oldSettings) {
            updatedSetting = await prisma.notification_settings.create({
                data: {
                    user_id: user.id,
                    ...result.data
                }
            })
        } else {
            updatedSetting = await prisma.notification_settings.update({
                where: {
                    id: oldSettings.id
                },
                data: result.data
            })
        };

        response.status(200).send({
            success: true,
            data: updatedSetting
        });
        return;


    } catch (error) {
        response.status(400).json({
            success: false,
            message: error,
        })
    }
})


router.delete("/:id", async (request: Request, response: Response) => {

    try {

        const id = Number(request.params.id);

        if (isNaN(id)) {
            response.status(400).json({
                success: false,
                message: "Id needs to be an integer",
            });
            return;
        }
        await prisma.users.delete({
            where: {
                id
            }
        });

        response.status(200).json({
            success: true,
            data: {
                id
            }
        })

    } catch (error) {
        response.status(400).json({
            success: false,
            message: error,
        })
    }

})


export { router as userRouter };
