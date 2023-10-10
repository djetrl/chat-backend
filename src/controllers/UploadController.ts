import express from "express";
import { UploadFileModel, MessageModel } from "../models";
import { IUploadFile, IUploadFileDocument } from "../models/UploadFile";
import path from "path";
import sharp from "sharp";
import fs from 'fs';
class UploadController {
  indexByDialogId = (req: express.Request, res: express.Response): void => {
    const dialogId: any = req.query.dialog;
    MessageModel.find({ dialog: dialogId }, 'attachments')
    .sort({ _id: -1})
      .populate({
        path: "attachments",
        select:(['-updatedAt', '-__v', '-user'])
      })
      .lean()
      .exec(function (err, attachments) {
        if (err) {
          return res.status(404).json({
            status: "error",
            message: "Messages not found"
          });
        }
        return res.json(attachments.filter((item: any) => {
          if (item.attachments.length >= 1) {
            return item
          }
        }))
      });

  };
  create = (req: express.Request, res: express.Response): void => {
    const userId: string = req.user._id;
    const file: any = req.file;
    const fileData = {
      filename: file.filename,
      size: file.size,
      ext: file.mimetype,
      url: `https://localhost:${process.env.PORT}/${file.path}`,
      user: userId,
    };
    if (fileData.ext.split('/')[0] === 'image' && fileData.ext.split('/')[1] !== 'gif' && fileData.ext.split('/')[1] !== 'xml') {
      sharp(file.path)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({
          quality: 80,
          lossless: false
        })
        .toFile(path.resolve(path.dirname(file.path), path.basename(file.path, path.extname(file.path)) + 'сжато.webp'))
        .then(() => {
          fileData.ext = 'image/webp';
          fileData.filename = path.basename(file.path, path.extname(file.path)) + 'сжато.webp';
          fileData.url = `https://localhost:${process.env.PORT}/public/media/image/${path.basename(file.path, path.extname(file.path)) + 'сжато.webp'}`
          fs.unlinkSync(file.path);
          const uploadFile: IUploadFileDocument = new UploadFileModel(fileData);
          uploadFile
            .save()
            .then((fileObj: IUploadFile) => {
              res.json({
                status: 'success',
                file: fileObj
              })
            }).catch((err: any) => {
              res.json({
                status: 'error',
                message: err
              })
            })
        })
    } else {
      const uploadFile: IUploadFileDocument = new UploadFileModel(fileData);
      uploadFile
        .save()
        .then((fileObj: IUploadFile) => {
          res.json({
            status: 'success',
            file: fileObj
          })
        }).catch((err: any) => {
          res.json({
            status: 'error',
            message: err
          })
        })
    }


  };

  delete = (req: express.Request | any, res: express.Response): void => {
    const id: string = req.query.id;
    UploadFileModel.findById(id, (err: string, file: IUploadFile) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: err,
        });
      }
      else {
        if (file) {
          const https = "https://localhost:3003/";
          fs.unlinkSync(file.url.slice(https.length))
          UploadFileModel.deleteOne({ _id: file._id }, function (err: any) {
            if (err) {
              return res.status(500).json({
                status: "error",
                message: err,
              });
            }

            res.json({
              status: "success",
            });
          });
        } else {
          res.json({
            status: "Not Found",
          });
        }
      }
    })

  };
}
export default UploadController;