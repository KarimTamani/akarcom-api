import express, { Request, Response } from 'express';
import config from "./config/config";
import cors from 'cors'; 
import { apiRouter } from './api';
 

const app = express();
const PORT = config.port ;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);



app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});