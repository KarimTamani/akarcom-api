import express, { Request, Response } from 'express';
import config from "./config/config";
import cors from 'cors';
import { apiRouter } from './api';
import http from "http";
import { setupSocket } from './socket';
import "./utils/subscription-service"  ;
import path from "path" ; 

const PORT = config.port;

const app = express();
const server = http.createServer(app);

setupSocket(server) ; 
// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter); 
app.use( "/uploads" , express.static( path.join(__dirname , "../uploads")));
 
console.log (path.join(__dirname , "../uploads"))

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});