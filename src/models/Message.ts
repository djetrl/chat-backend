import mongoose,{ Schema,Document } from "mongoose";
import  validator from 'validator';

export interface IMessage extends Document{
  text:{
    type:String,
    require:Boolean
  };
  dialog:{
    type:Schema.Types.ObjectId,
    ref:string,
    require:true

  };
  readed:{
    type:Boolean,
    default:Boolean
  }

  
}
    // TODO: Сделать 
    // attachemets: аттач файлов
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
  },
  {
    timestamps: true,
    usePushEach: true
  }
);
const MessageModel = mongoose.model<IMessage>("Messages", MessageSchema);
export default MessageModel;