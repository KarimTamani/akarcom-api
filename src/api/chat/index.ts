import express, { Request, response, Response } from "express";
import { MessageInput, messageSchema } from "../../lib/chat";
import prisma from "../../../prisma/prisma";
import { emit, EVENTS } from "../../socket";
import * as p from "prisma"
import { AuthenticatedRequest } from "../../middleware/auth";

const router = express.Router();

router.post("/message", async (request: Request<{}, {}, MessageInput>, response: Response) => {
    try {

        const result = messageSchema.safeParse(request.body);
        if (!result) {
            response.status(401).json(result); return;
        }
        const { data } = result;

        const receiver = await prisma.users.findUnique({ where: { id: data.receiver_id } });
        if (!receiver) {
            response.status(404).json({ success: false, error: "Receiver not found" });
        }

        const userId = (request as any).user.id;
        const conversation = await prisma.$transaction(async (tx) => {
            let conversation: any = await tx.conversations.findMany({
                where: {
                    OR: [
                        { created_by: userId, user_id: receiver.id },
                        { created_by: receiver.id, user_id: userId },
                    ]
                }
            });
            if (conversation && conversation.length == 1) {
                conversation = conversation.pop();

            }
            if (!conversation) {
                conversation = await tx.conversations.create({
                    data: {
                        created_by: userId,
                        user_id: receiver.id
                    }
                })
            }

            const message = await tx.messages.create({
                data: {
                    ...data,
                    sender_id: userId,
                    conversation_id: conversation.id
                }
            });

            await tx.conversations.update({
                where: {
                    id: conversation.id
                },
                data: {
                    updated_at: new Date()
                }
            })

            conversation.messages = [message];

            return conversation;

        })

        emit(EVENTS.NEW_MESSAGE, receiver.id, conversation);

        response.status(200).json({
            scucess: true,
            data: conversation
        });

    } catch (error) {
        response.status(500).json({ success: false, error })
    }
})


router.get("/message/:sender_id", async (request: AuthenticatedRequest, response: Response) => {
    try {
        const userId = request.user.id;
        const sender_id = Number(request.params.sender_id);

        const {
            offset = "0", limit = "20"
        } = request.query;

        if (isNaN(sender_id)) {
            response.status(401).json({ success: false, error: "Sender id is required" });
        }


        const conversation = await prisma.$transaction(async (tx) => {
            let conversation: any = await tx.conversations.findMany({
                where: {
                    OR: [
                        { created_by: userId, user_id: sender_id },
                        { created_by: sender_id, user_id: userId },
                    ]
                }
            });

            if (!conversation || conversation.length == 0)
                return undefined;
            conversation = conversation.pop();

            const messages = await prisma.messages.findMany({
                where: {
                    OR: [
                        {
                            sender_id: sender_id,
                            receiver_id: userId,
                        },
                        {
                            sender_id: userId,
                            receiver_id: sender_id,
                        },
                    ],
                    conversation_id: conversation.id
                },
                skip: parseInt(offset as string),
                take: parseInt(limit as string),
                orderBy: {
                    sent_at: "desc"
                }
            });
            conversation.messages = messages;
        })

        response.status(200).json({ success: true, data: conversation });
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
});




router.get("/message", async (request: AuthenticatedRequest, response: Response) => {
    try {
        const userId = request.user.id;

        const {
            offset = "0", limit = "20"
        } = request.query;
 

        const conversations = await prisma.conversations.findMany({
            where: {
                OR: [
                    { created_by: userId },
                    { user_id: userId },
                ],
            },
            include: {
                messages: {
                    orderBy: { sent_at: 'desc' },
                    take: 1, // last message only
                },
            },
            orderBy: {
                updated_at: "desc"
            },
            skip: parseInt(offset as string),
            take: parseInt(limit as string)

        })

        response.status(200).json({ success: true, data: conversations });
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
});


router.put('/message/read/:sender_id', async (request: Request, response: Response) => {
    try {
        const sender_id = Number(request.params.sender_id);
        if (isNaN(sender_id)) {
            response.status(401).json({ success: false, error: "Sender id is required" });
        }

        const current_date = new Date();

        const updatedMessages = await prisma.messages.updateMany({
            where: {
                read_at: null,
                sender_id,
                receiver_id: (request as any).user.id
            },
            data: {
                read_at: current_date
            }
        })

        response.status(200).json({
            success: true,
            count: updatedMessages.count,
            data: current_date
        })

    } catch (error) {
        response.status(500).json({ success: false, error })
    }
})


export {
    router as chatRouter
}