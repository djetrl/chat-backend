
import express from 'express';
import { createServer } from 'https';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
import "./core/db";
import createRoutes from "./core/routes";
import createSoket from "./core/socket";


const app = express();
const https = createServer({
  key: fs.readFileSync(path.join(__dirname, '../cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../cert', 'cert.pem')),
}, app);
const io = createSoket(https)


createRoutes(app, io);
const PORT: number = process.env.PORT ? Number(process.env.PORT) : 3003;
https.listen(PORT, function () {
  console.log(`Server: https://localhost:${process.env.PORT}`);
});
// TODO:
// Sockets: Сделать получения сообщений/я  через Get запрос. То есть, когда придёт сообщения от сокета
// то мы посылаем запрос на сервер, что бы получать последнее сообщения из сервера, а не отправлять
// Всю инфу в самом сокете