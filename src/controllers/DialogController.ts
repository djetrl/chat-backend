 
import express from "express";
import socket from 'socket.io';
import { DialogModel, MessageModel } from "../models";

class DialogController {
  io: socket.Server
  constructor(io: socket.Server){
    this.io = io;
  }
  index = (req: any, res: express.Response) => {
    const userId = req.user._id;

    DialogModel.find()
      .or([{ author: userId }, { partner: userId }])
      .populate(["author", "partner"])
      .populate({
        path: "lastMessage",
        populate: {
          path: "user"
        }
      })
      .exec(function(err, dialogs) {
        if (err) {  
          return res.status(404).json({
            status:'error',
            message: "Dialogs not found"
          });
        }
        return res.json(dialogs);
      });
  };



  
  create = (req: any, res: express.Response) => {
    const postData = {
      author: req.user._id,
      partner: req.body.partner
    };
    const dialog = new DialogModel(postData);

    dialog
      .save()
      .then((dialogObj: any) => {
        const message = new MessageModel({
          text: req.body.text,
          user: req.user._id,
          dialog: dialogObj._id
        });

        message
          .save()
          .then(() => {
            dialogObj.lastMessage = message._id;
            dialogObj.save().then(()=>{
              res.json(dialogObj);
              this.io.emit("SERVER:DIALOG_CREATED",{
                ...postData,
                dialog:dialogObj
            }); 
            })
          })
          .catch(err => {
            res.json({
              status:'error',
              message:err
            });
          });
      })
      .catch(reason => {
        res.json(reason);
      });
  };
    delete = (req: express.Request, res: express.Response) =>{
      const id: string = req.params.id;
      DialogModel.findOneAndRemove({_id:id}).then((dialog:any)=> {
        if(dialog){
          res.json({
            message:`Dialog delete`
          })
        }
      }).catch(()=>{
        res.json({
          message:`Dialog not found`
        })
      });
    }
}

export default DialogController;