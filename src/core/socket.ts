import socket from 'socket.io';
import http from 'http';
export default (http:http.Server)=>{
  const io = new socket.Server(http,{
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })
  io.on('connection', (socket:any) => {
    socket.on("DIALOG:JOIN", (dialogId:string)=>{
      socket.dialogId = dialogId;
      socket.join(dialogId);
      console.log('join', dialogId);
      })
      socket.on("DIALOGS:TYPING", (obj:any)=>{
        socket.emit("DIALOGS:TYPING", obj)
      })
  });
  return io
}