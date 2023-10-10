import mongoose,{ Schema,Document } from "mongoose";
import { IMessage } from "./Message";
import { IUser } from "./User";
import { IUploadFile } from "./UploadFile";
export interface IDialog extends Document{
  partner:IUser | string | Array<string>;
  author:IUser | string;
  lastMessage: IMessage | string;
  name?:string;
  avatar?:IUploadFile | string;
}

const DialogSchema = new Schema(
  {
    partner: [{type:Schema.Types.ObjectId, ref:'User'}],
    author: {type:Schema.Types.ObjectId, ref:'User'},
    lastMessage:{type:Schema.Types.ObjectId, ref:'Message'},
    name:{type:String},
    avatar:[{type:Schema.Types.ObjectId, ref:'UploadFile'}],

  },
  {
    timestamps: true,
    usePushEach: true
  }
);

const DialogModel = mongoose.model<IDialog>("Dialog", DialogSchema);

export default DialogModel;