import bodyParser from 'body-parser';
import express from 'express';
import socket from 'socket.io';
import { UserCtrl, DialogCtrl, MessageCtrl, UploadCtrl } from '../controllers';
import { updateLastSeen, checkAuth } from '../middleware';
import { loginValidation,registerValidation } from '../utils/validations';
import multer  from  "./multer";
//TODO:
// Сделать так , чтобы контреллеры знали о существовании сокетов и могли с ними работать отдельно
const createRoutes =(app:express.Express, io: socket.Server)=>{
  app.use(bodyParser.json());
  app.use(checkAuth);
  app.use(updateLastSeen);

  const UserController = new UserCtrl(io) ;
  const DialogController = new DialogCtrl(io) ;
  const MessageController = new MessageCtrl(io);
  const UploadFileController = new UploadCtrl();

  app.get('/user/me', UserController.getMe)
  app.get('/user/verify',  UserController.verify);
  app.post('/user/signup',registerValidation, UserController.create);
  app.post('/user/signin', loginValidation, UserController.login);
  app.get('/user/find',  UserController.findUsers);
  app.get('/user/:id', UserController.show);
  app.delete('/user/:id', UserController.delete);
  

  

  app.get('/dialogs', DialogController.index);
  app.delete('/dialogs/:id', DialogController.delete); 
  app.post('/dialogs', DialogController.create);

  app.get('/messages', MessageController.index);
  app.post('/messages', MessageController.create); 
  app.delete('/messages',  MessageController.delete);

  app.post('/files', multer.single('file'), UploadFileController.create);  
  app.delete('/files', UploadFileController.delete);
}
export default createRoutes;