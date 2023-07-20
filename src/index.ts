
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

http.listen(process.env.PORT, function() {
  console.log(`Server: http://localhost:${process.env.PORT}`);
});
// TODO:
// Sockets: Сделать получения сообщений/я  через Get запрос. То есть, когда придёт сообщения от сокета 
// то мы посылаем запрос на сервер, что бы получать последнее сообщения из сервера, а не отправлять 
// Всю инфу в самом сокете