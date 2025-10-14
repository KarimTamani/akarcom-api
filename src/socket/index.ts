import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from "../config/config";
import prisma from "../../prisma/prisma";

let io: Server; // global socket instance

const userSockets = new Map<number, string>(); // userId → socketId


export enum EVENTS {
    NEW_MESSAGE = "new_message",
    NEW_NOTIFICATION = "new_notification",
 
    TYPING_STATUS = "typing_status"
}



export const setupSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            next(new Error("Unauthorized"))
            return;
        }
        try {
            // 2. Verify token
            const decoded = jwt.verify(token, config.JWT_SECRET as string) as JwtPayload;
            // get the user
            const user: any = await prisma.users.findUnique({ where: { email: decoded.identifier } });

            socket.data.userId = user.id;
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });


    io.on("connection", (socket: Socket) => {
        const userId = socket.data.userId;

        userSockets.set(userId, socket.id);
        console.log(`✅ User ${userId} connected`);


        socket.on("disconnect", () => {
            userSockets.delete(userId);
            console.log(`❌ User ${userId} disconnected`);
        });


        socket.on(EVENTS.TYPING_STATUS, (args : { userId : number , status : boolean}) => {
            if (!args.userId)
                return;


            const userSocket = userSockets.get(args.userId)
            if (!userSocket)
                return;

            io.to(userSocket).emit(EVENTS.TYPING_STATUS, {
                userId   , 
                typing : args.status  
            }) ; 
        }) ; 

    });
}



export const getIo = () => {
    if (!io)
        throw Error("Socket io not set up");
    return io;
}


export const emit = (event: EVENTS, userId: number, data: any) => {
    const socketId = userSockets.get(userId);
    if (socketId) io.to(socketId).emit(event, data)
}