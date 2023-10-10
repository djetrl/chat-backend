import express from "express";
import socket from "socket.io";
import { MessageModel, DialogModel,UploadFileModel } from "../models";
import { IMessage } from "../models/Message";
import { unlinkSync } from "fs";
class MessageController {
  io: socket.Server;

  constructor(io: socket.Server) {
    this.io = io;
  }
  updateReadStatus = (
    res: express.Response,
    userId: string,
    dialogId: string
  ): void => {
    MessageModel.updateMany(
      { dialog: dialogId, user: { $ne: userId } },
      { $set: { read: true } },
      {},
      (err: any): void => {
        if (err) {
          res.status(500).json({
            status: "error",
            message: err,
          });
        } else {
          this.io.emit("SERVER:MESSAGES_READED", {
            userId,
            dialogId,
          });
        }
      }
    );
  };
  
  index = (req:express.Request, res: express.Response):void => {
    const dialogId: any = req.query.dialog;
    let skip:any=req.query.skip;
    const userId =req.user._id;
    if(skip === undefined){
      skip = 0;
    }
    this.updateReadStatus(res, userId, dialogId);
    MessageModel.find({ dialog: dialogId })
     .sort({ _id: -1})
      .limit(10)
      .skip(Number(skip))
      .populate(["user","attachments",'embeddedMessage'])
      .populate({
        path:'attachments',
        select:(['-updatedAt', '-user'])
      })
      .populate({
        path: "user",
        populate: {
          path: "avatar",
          select:(['_id', 'filename', 'url'])
        },
        select:(['_id','fullname','avatar',])
      })
      .populate({
        path: "embeddedMessage",
        populate: {
          path: "user",
         select:(['_id','fullname'])
        }
      })
      .populate({
        path: "embeddedMessage",
        populate: {
          path: "attachments",
          select:(['-updatedAt', '-user'])
        },
        select:(['_id','attachments','text','user'])
      })
      .select('-updatedAt')
      .lean()
      .exec(function(err, messages) {
        if (err) {     
          return res.status(404).json({
            status:"error",
            message: "Messages not found"
          });
        }
        MessageModel.countDocuments({dialog:dialogId}).exec((count_error, count)=>{
          if(count_error){
            return res.status(404).json({
              status:"error",
              message: count_error
            });
          }
          return res.json({
            total: count,
            messages: [...messages].reverse()
          })
        })
        
      });
  };

  create = (req: express.Request, res: express.Response):void => {
    const userId: string = req.user._id;

    const postData = {
      text: req.body.text,
      dialog: req.body.dialog_id,
      attachments:req.body.attachments,
      embeddedMessage:req.body.embeddedMessage,
      user: userId
    };
    
    const message = new MessageModel(postData);
    this.updateReadStatus(res, userId, req.body.dialog_id);
    message
    .save()
    .then((obj: IMessage) => {
      obj.populate(
        "dialog user attachments embeddedMessage"
      )
      .populate({
        path: "embeddedMessage",
        populate: {
          path: "user"
        }
      })
      .populate({
        path: "embeddedMessage",
        populate: {
          path: "attachments"
        }
      })
      .execPopulate(
        (err: any, message: IMessage) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: err,
            });
          }

          DialogModel.findOneAndUpdate(
            { _id: postData.dialog },
            { lastMessage: message._id },
            { upsert: true },
            function (err) {
              if (err) {
                return res.status(500).json({
                  status: "error",
                  message: err,
                });
              }
            }
          );
          
          res.json(message);

          this.io.emit("SERVER:NEW_MESSAGE", message);
        }
      )
    })
    .catch((reason) => {
      res.json(reason);
    });
  };

  delete = (req: express.Request | any, res: express.Response): void => {
    const id:string= req.query.id;
    const userId: string = req.user._id;

    MessageModel.findById(id)
    .populate(["attachments"])
    .exec((err:any, message: any) => {
      if (err || !message) {
        return res.status(404).json({
          status: "error",
          message: "Message not found",
        });
      }
      if(message.attachments){
        message.attachments.forEach((attachment:any) => {        
          const https = "https://localhost:3003/";
          unlinkSync(attachment.url.slice(https.length));
          UploadFileModel.deleteOne({ _id: attachment._id }, function (err: any) {
            if (err) {
              return res.status(500).json({
                status: "error",
                message: err,
              });
            }
          });
        });
      }
      if (message.user.toString() === userId) {
        const dialogId = message.dialog;
        message.remove();

        MessageModel.findOne(
          { dialog: dialogId },
          {},
          { sort: { created_at: -1 } },
          (err, lastMessage) => {
            if (err) {
              res.status(500).json({
                status: "error",
                message: err,
              });
            }

            DialogModel.findById(dialogId, (err:any, dialog:any) => {
              if (err) {
                res.status(500).json({
                  status: "error",
                  message: err,
                });
              }

              if (!dialog) {
                return res.status(404).json({
                  status: "not found",
                  message: err,
                });
              }      
              dialog.lastMessage = lastMessage ? lastMessage._id.toString() : "";
              
              dialog.save();
            });
          }
        );

        return res.json({
          status: "success",
          message: "Message deleted",
        });
      } else {
        return res.status(403).json({
          status: "error",
          message: "Not have permission",
        });
      }
    });
  };
  findMessage=(req:express.Request | any, res:express.Response):void=>{
    const dialogId:string = req.query.dialogId;
    const text:string = req.query.text;
    MessageModel.find()
        .and([{dialog:dialogId},{text:new RegExp(text,"i" )}])
        .populate(["user","attachments",'embeddedMessage'])
        .populate({
          path:'attachments',
          select:(['-updatedAt', '-user'])
        })
        .populate({
          path: "user",
          populate: {
            path: "avatar",
            select:(['_id', 'filename', 'url'])
          },
          select:(['_id','fullname','avatar',])
        })
        .populate({
          path: "embeddedMessage",
          populate: {
            path: "user",
           select:(['_id','fullname'])
          }
        })
        .populate({
          path: "embeddedMessage",
          populate: {
            path: "attachments",
            select:(['-updatedAt', '-user'])
          },
          select:(['_id','attachments','text','user'])
        })
        .select('-updatedAt')
        .lean()
        .exec(function(err, messages) {
          if (err) {     
            return res.status(404).json({
              status:"error",
              message: "Messages not found"
            });
          }
          res.json(messages)
          
        });

  }
}

export default MessageController;