import mongoose,{ Schema,Document } from "mongoose";
import { IDialog } from "./Dialog";
import { IUploadFile } from "./UploadFile";
export interface IMessage extends Document{
  text:string;
  dialog:IDialog | string;
  readed:boolean;
  embeddedMessage?:IMessage | string;
  attachments?:IUploadFile | string;
}

const MessageSchema = new Schema(
  {
    text:{type:String, require:Boolean},
    dialog: {type:Schema.Types.ObjectId, ref:'Dialog',require:true},
    user: {type:Schema.Types.ObjectId, ref:'User',require:true},
    readed:{
      type:Boolean,
      default:false
    },
    attachments: [{type:Schema.Types.ObjectId, ref:'UploadFile'}],
    embeddedMessage: [{type:Schema.Types.ObjectId, ref:'Message'}],
  },
  {
    timestamps: true,
    usePushEach: true
  }
);

const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);

export default MessageModel;