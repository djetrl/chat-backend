
import express from "express";
import socket from 'socket.io';
import { MessageModel, DialogModel, UploadFileModel } from "../models";
import { unlinkSync } from "fs";
class DialogController {

  io: socket.Server
  constructor(io: socket.Server) {
    this.io = io;
  }

  index = (req: express.Request, res: express.Response): void => {
    const userId = req.user._id;

    DialogModel.find()
      .or([{ author: userId }, { partner: userId }])
      .populate(["author", "partner"])
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

  create = (req: express.Request, res: express.Response): void => {
    const postData = {
      author: req.user._id,
      partner: req.body.partner,
    };

    DialogModel.findOne(
      {
        author: req.user._id,
        partner: req.body.partner,
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
            .catch((err) => {
              res.json({
                status: 'error',
                message: err,
              });
            });
        }
      },
    );
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
                      const http = "http://localhost:3003/";
                      unlinkSync(attachment.url.slice(http.length))
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