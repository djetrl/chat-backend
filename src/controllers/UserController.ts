import express from "express";
import bcrypt from "bcrypt";
import socket from 'socket.io';
import { validationResult, Result, ValidationError } from "express-validator";
import mailer from '../core/mailer'
import { UserModel, DialogModel, MessageModel, UploadFileModel } from "../models";
import { IUser } from "../models/User";
import { createJWToken, generateRandomPassword, generatePasswordHash } from '../utils';
import { SentMessageInfo } from "nodemailer/lib/sendmail-transport";
import { unlinkSync } from "fs";


const http = "http://localhost:3003/";
class UserController {
  
  io: socket.Server
  constructor(io: socket.Server) {
    this.io = io;
  }
  show = (req: express.Request, res: express.Response): void => {
    const id: string = req.params.id;
    UserModel.findById(id, (err: any, user: IUser) => {
      if (err || !user) {
        return res.status(404).json({
          message: "User not found"
        })
      }
      res.json(user)
    })
  }

  getMe = (req: express.Request, res: express.Response): void => {
    const id: string = req.user && req.user._id;
    UserModel.findById(id)
      .populate(["avatar"])
      .lean()
      .select('-password')
      .exec(function (err: any, user: any) {
        if (err || !user) {
          return res.status(404).json({
            message: "User not found"
          })
        }
        res.json(user)
      });


  }

  findUsers = (req: express.Request | any, res: express.Response): void => {
    const query: string = req.query.query;
    UserModel.find()
      .or([{
        fullname: new RegExp(query, "i")
      },
      { email: new RegExp(query, "i") }])
      .select('-password')
      .then((users: any) => res.json(users))
      .catch((err: any) => {
        return res.status(404).json({
          status: 'error',
          message: err
        })
      })

  }


  delete = (req: express.Request, res: express.Response): void => {
    const id: string = req.user && req.user._id
    if (req.user.avatar[0]) {
      UserModel.findOne(
        {
          _id: id
        })
        .populate(["avatar"])
        .lean()
        .exec(
          (err: any, user: any) => {
            if (err) {
              return res.status(500).json({
                status: 'error',
                message: err,
              });
            }
                unlinkSync(user.avatar[0].url.slice(http.length))
              
              UploadFileModel.deleteOne({ _id: user.avatar[0]._id }, function (err: any) {
                if (err) {
                  return res.status(500).json({
                    status: "error",
                    message: err,
                  });
                }
              });
          }
        )

    }
    UserModel.findOneAndRemove({ _id: id })
      .then((user: IUser | null) => {
        if (user) {

          DialogModel.find({ $or: [{ partner: id }, { author: id }] }).then((response) => {
            response.forEach(responseItem => {

              MessageModel.find({ dialog: responseItem._id })
              .populate(['attachments'])
              .lean()
              .exec(function (err, responseMessage) {
                if(err){
                  res.status(404).json({
                    status: "error",
                    message: err
                  });
                }
                responseMessage.forEach((message:any)=>{
                  message.attachments.forEach((attachment:any)=>{
                    unlinkSync(attachment.url.slice(http.length))
                  })
                })
              })
              MessageModel.deleteMany({ dialog: responseItem._id })
              .catch((err:any)=>{
                res.status(404).json({
                  status: "error",
                  message:err
                });
              })
            })
          })
          DialogModel.deleteMany({ $or: [{ partner: id }, { author: id }] })
            .then((dialog: any) => {
              res.json({
                message: `User ${user.fullname} delete and Dialog and messages delete`
              })
            })
        } else {
          res.status(404).json({
            status: "error",
          });
        }
      }).catch((err: any) => {
        res.json({
          message: err
        })
      });
  }

  create = (req: express.Request, res: express.Response): void => {
    const postData: { email: string, fullname: string, password: string } = {
      email: req.body.email.toLowerCase(),
      fullname: req.body.fullname,
      password: req.body.password
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      const user = new UserModel(postData);

      user
        .save()
        .then((obj: IUser) => {
          res.json(obj);
          mailer.sendMail(
            {
              from: "chatdjet@inbox.ru",
              to: postData.email,
              subject: "Подтверждение почты",
              html: `Для того, чтобы подтвердить почту, перейдите <a href="http://localhost:3000/signup/verify?hash=${obj.confirm_hash}">по этой ссылке</a>`,
            },
            function (err: Error | null, info: SentMessageInfo) {
              if (err) {
                console.log(err);
              } else {
                console.log(info);
              }
            }
          );
        })
        .catch((reason) => {
          res.status(500).json({
            status: "error",
            message: reason,
          });
        });
    }
  };

  verify = (req: express.Request | any, res: express.Response): void => {
    const hash: string = req.query.hash;
    if (!hash) {
      res.status(422).json({ errors: "Invalid hash" })
    } else {
      UserModel.findOne({ confirm_hash: hash }, (err: any, user: IUser) => {
        if (err || !user) {
          return res.status(404).json({
            status: 'error',
            message: 'Hash not found'
          })
        }
        user.confirmed = true;
        user.save((err: any) => {
          if (err) {
            return res.status(404).json({
              status: 'error',
              message: err
            })
          }
          res.json({
            status: 'success',
            message: 'Аккаунт успешно подтвержден!'
          });
        });
      });
    }
  };
  passwordVerification = (req: express.Request, res: express.Response): void => {
    const postData: { email: string; password: string } = {
      email: req.body.email,
      password: req.body.password,
    };

    const errors: Result<ValidationError> = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      UserModel.findOne({ email: postData.email }, (err: string, user: IUser) => {
        if (err || !user) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        if (bcrypt.compareSync(postData.password, user.password)) {
          res.json({
            status: "success",
          });
        } else {
          res.status(403).json({
            status: "error",
            message: "Incorrect password",
          });
        }
      });
    }
  };
  login = (req: express.Request, res: express.Response): void => {
    const postData: { email: string; password: string } = {
      email: req.body.email.toLowerCase(),
      password: req.body.password,
    };
  
    
    const errors: Result<ValidationError> = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      UserModel.findOne({ email: postData.email }, (err: string, user: IUser) => {
        if (err || !user) {
          return res.status(404).json({
            message: "User not found",
          });
        }
        if(user.confirmed){
          if (bcrypt.compareSync(postData.password, user.password)) {
            const token = createJWToken(user);
            res.json({
              status: "success",
              token,
            });
          } else {
            res.status(403).json({
              status: "error",
              message: "Incorrect password or email",
            });
          }
        }else{
          res.status(403).json({
            status: "error",
            message: "account not verified",
          });
        }

      });
    }
  };
  recoverPassword = (req: express.Request | any, res: express.Response): void => {
    const query: string = req.query.query.toLowerCase();
    const newPassword: any = generateRandomPassword(10);
    UserModel.findOne({ email: query }).exec(function (err, user) {


      if (err || user === null) {
        return res.status(404).json({
          status: "error",
          message: "User not found"
        });
      } else {
        generatePasswordHash(newPassword).then(
          (data) => {
            UserModel.updateOne({
              email: query
            },
              {
                password: data,
              },
              {},
              function (err: any, result: any) {
                if (err) {
                  return res.status(500).json({
                    status: "error",
                    message: err,
                  });
                }
                mailer.sendMail(
                  {
                    from: "chatdjet@inbox.ru",
                    to: query,
                    subject: "Новый пароль",
                    html: `Новый <b>пароль</b> для вашего аккаунта: ${newPassword}`,
                  },
                  function (err: Error | null, info: SentMessageInfo) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log(info);
                    }
                  }
                );
                return res.status(200).json({
                  status: "success",
                  user
                })
              })

          }
        )
      }

    })

  }
  update = (req: express.Request, res: express.Response) => {
    const userId: string = req.user._id;
    const postData: { email: string; fullname: string; avatar: any; user: string } = {
      email: req.body.email,
      fullname: req.body.fullname,
      avatar: req.body.avatar,
      user: userId
    };
    if (req.user.avatar[0]) {
      UserModel.findOne(
        {
          _id: userId
        })
        .populate(["avatar"])
        .exec(
          (err: any, user: any) => {
            if (err) {
              return res.status(500).json({
                status: 'error',
                message: err,
              });
            }
            if (user.avatar[0]._id != postData.avatar) {
              unlinkSync(user.avatar[0].url.slice(http.length))
              UploadFileModel.deleteOne({ _id: user.avatar[0]._id }, function (err: any) {
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

    }

    UserModel.findOneAndUpdate(
      { _id: postData.user },
      {
        email: postData.email,
        fullname: postData.fullname,
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
        return res.status(200).json(result)
      })

  };
  updatePassword = (req: express.Request, res: express.Response) => {
    const userId: string = req.user._id;
    const postData: { password: string; user: string } = {
      password: req.body.password,
      user: userId
    };
    generatePasswordHash(postData.password).then(
      (data) => {
        UserModel.findOneAndUpdate(
          { _id: postData.user },
          {
            password: data
          },
          {
            upsert: true,
            new: true
          })
          .exec(function (err: any, result: any) {
            if (err) {
              return res.status(500).json({
                status: "error",
                message: err,
              });
            }
            return res.status(200).json(result)
          })
      })
  }
}

export default UserController;