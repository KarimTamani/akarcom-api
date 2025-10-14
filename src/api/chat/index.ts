import express, { Request, response, Response } from "express";
import { MessageInput, messageSchema } from "../../lib/chat";
import prisma from "../../../prisma/prisma";
import { emit, EVENTS } from "../../socket";
import  * as p from  "prisma"

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

        const message = await prisma.messages.create({
            data: {
                ...data,
                sender_id: (request as any).user.id,
            }
        });

        emit(EVENTS.NEW_MESSAGE, receiver.id, message);

        response.status(200).json({
            scucess: true,
            data: message
        });

    } catch (error) {
        response.status(500).json({ success: false, error })
    }
})


router.get("/message/:sender_id", async (request: Request, response: Response) => {
    try {

        const sender_id = Number(request.params.sender_id);
        const {
            offset = "0", limit = "20"
        } = request.query;

        if (isNaN(sender_id)) {
            response.status(401).json({ success: false, error: "Sender id is required" });
        }
        const messages = await prisma.messages.findMany({
            where: {
                sender_id
            },
            skip: parseInt(offset as string),
            take: parseInt(limit as string),
            orderBy: {
                sent_at: "desc"
            }
        });
        response.status(200).json({ success: true, data: messages });
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
});




router.get("/message", async (request: Request, response: Response) => {
    try {

        const {
            offset = "0", limit = "20"
        } = request.query;

        const [messages] = await prisma.$transaction(async (tx) => {
            // Step 1: group by sender to get latest message IDs
            const latestMessages = await tx.messages.groupBy({
                by: ['sender_id'],
                where: {
                    receiver_id: (request as any).user.id,
                },
                _max: {
                    sent_at: true,
                    id: true,
                },
                orderBy: {
                    _max: {
                        sent_at: 'desc',
                    },
                },

                skip: parseInt(offset as string),
                take: parseInt(limit as string)
            });

            // Step 2: fetch full message info + sender
            const lastMessageIds = latestMessages.map((m) => m._max.id);

            const messages = await tx.messages.findMany({
                where: { id: { in: lastMessageIds } },
                include: {
                    users_messages_sender_idTousers: {
                        select: {
                            id: true,
                            full_name: true,
                            picture_url: true,
                            email: true
                        }
                    }

                },
                orderBy: { sent_at: 'desc' },
            });

            return [messages];
        });

        response.status(200).json({ success: true, data: messages });
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
                read_at : null , 
                sender_id,
                receiver_id: (request as any).user.id
            },
            data: {
                read_at: current_date
            }
        })
        
        response.status(200).json( {
            success : true , 
            count : updatedMessages.count , 
            data : current_date 
        })
    
    } catch (error) {
        response.status(500).json({ success: false, error })
    }
})


export {
    router as chatRouter
}