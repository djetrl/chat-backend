
import express from "express";
import socket from 'socket.io';
import { MessageModel, DialogModel, UploadFileModel } from "../models";
import { unlinkSync } from "fs";
import { IDialog } from "../models/Dialog";
import {isInArray} from '../utils';

const https = "https://localhost:3003/";
class DialogController {


  io: socket.Server
  constructor(io: socket.Server) {
    this.io = io;
  }

  index = (req: express.Request, res: express.Response): void => {
    const userId = req.user._id;

    DialogModel.find()
      .or([{ author: userId }, { partner: userId }])
      .populate(["author", "partner","avatar" ])
      .populate({
        path: "lastMessage",
        populate: {
          path: "user",
          select:('_id')
        },
        select:(['-createdAt','-dialog', '-embeddedMessage'])

      })
      .populate({
        path: "partner",
        populate: {
          path: "avatar",
          select:(['_id', 'filename', 'url'])
        },
        select:(['-password', '-confirm_hash', '-updatedAt','-createdAt','-confirmed'])
      })
      .populate({
        path: "author",
        populate: {
          path: "avatar",
          select:(['_id', 'filename', 'url'])
        },
        select:(['-password', '-confirm_hash', '-updatedAt','-createdAt','-confirmed'])
      })
      .populate({
        path: "avatar",
        select:(['url'])
      })
      .lean()
      .select('-password')
      .exec(function (err, dialogs) {
        if (err) {
          return res.status(404).json({
            status: 'error',
            message: "Dialogs not found"
          });
        }
        return res.json(dialogs);
      });
  };
  addPartnerFromDialog = (req: express.Request, res: express.Response): void => {
    const dialog: string = req.body.dialog;
    const partner: string = req.body.partner;
    DialogModel.findById(dialog)
    .populate(["author", "partner","avatar" ])
    .populate({
      path: "lastMessage",
      populate: {
        path: "user",
        select:('_id')
      },
      select:(['-createdAt','-dialog', '-embeddedMessage'])
    })
    .populate({
      path: "author",
      populate: {
        path: "avatar",
        select:(['_id', 'filename', 'url'])
      },
      select:(['-password', '-confirm_hash', '-updatedAt','-createdAt','-confirmed'])
    })
    .populate({
      path: "avatar",
      select:(['url'])
    })
    .exec((err: any, dialog: any) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: err,
          });
        }
     
        if(isInArray(partner, dialog.partner)){
          return res.status(500).json({
            status: 'error',
            message: 'the user is already in the dialogs',
          });
        } 
        dialog.partner = [...dialog.partner, partner];
        dialog.save().then(() => {
          res.json(dialog);
          this.io.emit('SERVER:ADD_USER_DIALOG', { dialog });
          
        });
        
      });
    
  }
  create = (req: express.Request, res: express.Response): void => {
    const postData = {
      author: req.user._id,
      partner: req.body.partner,
    };
    
    DialogModel.findOne(
      {
        author: req.user._id,
        partner: req.body.partner,
        name:{ $exists: false },
      },
      (err: any, dialog: any) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: err,
          });
        }
        
        if (dialog) {
          return res.status(403).json({
            status: 'error',
            message: 'Такой диалог уже есть',
          });
        } else {
          const dialog = new DialogModel(postData);

          dialog
            .save()
            .then((dialogObj) => {
              const message = new MessageModel({
                text: req.body.text,
                user: req.user._id,
                dialog: dialogObj._id,
              });

              message
                .save()
                .then(() => {
                  dialogObj.lastMessage = message._id;
                  dialogObj.save().then(() => {
                    res.json(dialogObj);
                    this.io.emit('SERVER:DIALOG_CREATED', {
                      ...postData,
                      dialog: dialogObj,
                    });
                  });
                })
                .catch((reason) => {
                  res.json(reason);
                });
            })
            .catch((err:object) => {
              res.json({
                status: 'error',
                message: err,
              });
            });
        }
      },
    );
  };
  
  createGroup = (req: express.Request, res: express.Response): void => {
    console.log(req.body);
    
    const postData = {
      author: req.user._id,
      partner: req.body.partner,
      name:req.body.name,
      avatar:req.body.avatar
    };

    const dialog:IDialog = new DialogModel(postData);        
    if(req.body.avatar){
      dialog.avatar=req.body.avatar;  
    }
   
    dialog
      .save()
      .then((dialogObj:IDialog) => {

        const message = new MessageModel({
          text: req.body.text,
          user: req.user._id,
          dialog: dialogObj._id,
        });

        message
          .save()
          .then(() => {
            dialogObj.lastMessage = message._id;
            dialogObj.save().then(() => {
              res.json(dialogObj);
              this.io.emit('SERVER:DIALOG_CREATED', {
                ...postData,
                dialog: dialogObj,
              });
            });
          })
          .catch((reason) => {
            res.json(reason);
          });
      })
      .catch((err:object) => {
        res.json({
          status: 'error',
          message: err,
        });
      });

  };
 deletePartner = (req: express.Request, res: express.Response): void =>  {
    const dialog: string = req.body.dialog;
    const partner: string = req.body.partner;
    DialogModel.findById(dialog)
     .exec((err: any, dialog: any) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: err,
          });
        }

        
        if(dialog.partner.includes(partner)){
          dialog.partner = dialog.partner.filter((Dialogpartner:any)=>Dialogpartner._id != partner)
          dialog.save().then(() => {
            res.json(dialog);
          });
        }else{
          return res.status(500).json({
            status: 'error',
            message: 'user not found in dialog',
          });
        }   

        
      });
    
  }

  update = (req: express.Request, res: express.Response) => {
    const dialogId: string = req.body._id;
    const postData: { name: string; avatar: string} = {
      name: req.body.name,
      avatar: req.body.avatar
    };
      DialogModel.findOne(
        {
          _id: dialogId
        })
        .populate('avatar')
        .exec(
          (err: any, dialog: any) => {
            if (err) {
              return res.status(500).json({
                status: 'error',
                message: err,
              });
            }
            if (dialog.avatar[0]._id != postData.avatar) {
              unlinkSync(dialog.avatar[0].url.slice(https.length))
              UploadFileModel.deleteOne({ _id: dialog.avatar[0] }, function (err: any) {
                if (err) {
                  return res.status(500).json({
                    status: "error",
                    message: err,
                  });
                }
              });
              
            }
          }
        )

        DialogModel.findOneAndUpdate(
          { _id: dialogId },
          {
            name: postData.name,
            avatar: postData.avatar
          },
          {
            upsert: true,
            new: true
          }).populate('avatar')
          .exec(function (err: any, result: any) {
            if (err) {
              return res.status(500).json({
                status: "error",
                message: err,
              });
            }
          return  res.status(200).json(result);
          })


  };
  delete = (req: express.Request, res: express.Response): void => {
    const id: string = req.params.id;
    DialogModel.findOneAndRemove({ _id: id })
      .then((dialog: any) => {
        if (dialog) {
          MessageModel.find({ dialog: id })
            .populate(["attachments"])
            .exec((err: any, messages: any) => {
              if (err) {
                res.json({
                  message: `Message not found`
                })
              } else {

                messages.forEach((message:any)=>{
                  if (message.attachments) {
                    message.attachments.forEach((attachment: any) => { 
                      const https = "https://localhost:3003/";
                      unlinkSync(attachment.url.slice(https.length))
                    })
                  }
                })
                MessageModel.deleteMany({ dialog: id }).then(() => {
                  res.json({
                    status: "success",
                    message: `Dialog and messages delete`
                  })
                  this.io.emit('SERVER:DIALOG_DELETED', {});
                }).catch(() => {
                  res.json({
                    message: `Message not found`
                  })
                })
              }
            })
        }
      })
      .catch(() => {
        res.json({
          message: `Dialog not found`
        })
      });
  }
}

export default DialogController;