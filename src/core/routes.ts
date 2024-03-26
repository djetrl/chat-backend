import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import socket from 'socket.io';
import path from 'path';
import { UserCtrl, DialogCtrl, MessageCtrl, UploadCtrl } from '../controllers';
import { updateLastSeen, checkAuth, uploadFile } from '../middleware';
import { loginValidation,registerValidation } from '../utils/validations';

const createRoutes =(app:express.Express, io: socket.Server)=>{
  const UserController = new UserCtrl(io) ;
  const DialogController = new DialogCtrl(io) ;
  const MessageController = new MessageCtrl(io);
  const UploadFileController = new UploadCtrl();
 
  var originsWhitelist = [
    'http://localhost:3000'     //this is my front-end url for development
  
  ];
  var corsOptions = {
    origin: function(origin:any, callback:any){
          console.log(origin);
          var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
          console.log(isWhitelisted);
          callback(null, isWhitelisted);
    },
    credentials:true
  }
  
  app.use(cors(corsOptions))

  app.use(bodyParser.json());
  app.use(checkAuth);
  app.use(updateLastSeen);
  app.use('/public/',express.static(path.join(__dirname, '../../public')));


  app.get('/user/me', UserController.getMe);
  app.delete('/user/me', UserController.delete);
  app.get('/user/verify',  UserController.verify);
  app.post('/refresh-tokens', UserController.refreshToken);
  app.post('/user/signup',registerValidation, UserController.create);
  app.post('/user/signin', loginValidation, UserController.login);
  app.get('/user/find',  UserController.findUsers);
  app.patch('/user/recover',  UserController.recoverPassword);
  app.post('/user/passwordVerification', loginValidation, UserController.passwordVerification);
  app.get('/user/:id', UserController.show);
  app.patch('/user/me', UserController.update)
  app.patch('/user/passwordChange', UserController.updatePassword)
  
  app.get('/dialogs', DialogController.index);
  app.patch('/dialogs', DialogController.update)
  app.delete('/dialogs/:id', DialogController.delete); 
  app.post('/dialogs', DialogController.create);
  app.post('/dialogs/group', DialogController.createGroup);
  app.post('/dialogs/addUserGroup', DialogController.addPartnerFromDialog);
  app.post('/dialogs/deletePartnerForGroup', DialogController.deletePartner);
  app.get('/messages', MessageController.index);
  app.get('/messages/find', MessageController.findMessage);
  app.delete('/messages',  MessageController.delete);
  app.post('/messages', MessageController.create); 

  app.get('/files/media', UploadFileController.indexByDialogId);
  app.delete('/files/media', UploadFileController.delete);
  app.post('/files/media',uploadFile.single('file') , UploadFileController.create);   

  app.get('/test', function(req, res) {
    res.send('hello world');
  });

}
export default createRoutes;