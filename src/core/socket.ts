import socket from 'socket.io';
import https from 'https';
import fs from 'fs';
import path from 'path';
const httpsServer = https.createServer({
  key: fs.readFileSync(path.join(__dirname, '../../cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../../cert', 'cert.pem')),
});
export default (httpsServer:https.Server)=>{
  const io = new socket.Server(httpsServer,{
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })
  io.on('connection', (socket:any) => {
    socket.on("DIALOG:JOIN", (dialogId:string)=>{
      console.log(dialogId);
 
      socket.dialogId = dialogId;
      socket.join(dialogId);
  });
      socket.on("DIALOGS:TYPING", (obj:any)=>{
        console.log('DIALOGS:TYPING',obj.dialogId);
        socket.to(obj.dialogId).emit("DIALOGS:TYPING", obj.user)
      })
  });
  return io
}

