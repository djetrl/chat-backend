
import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';


dotenv.config();
import  "./core/db";
import createRoutes  from  "./core/routes";
import createSoket  from  "./core/socket";


const app = express();  
const http = createServer(app);
const io = createSoket(http)


createRoutes(app,io);
const PORT:number = process.env.PORT ? Number(process.env.PORT):3003;
http.listen(PORT, function() {
  console.log(`Server: http://localhost:${process.env.PORT}`);
});