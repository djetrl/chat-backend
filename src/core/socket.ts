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