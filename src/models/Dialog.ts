import mongoose,{ Schema,Document } from "mongoose";
import { IMessage } from "./Message";

export interface IDialog extends Document{
  partner:{
    type:Schema.Types.ObjectId ,
    ref:string,
    require:true

  };
  author:{
    type:Schema.Types.ObjectId ,
    ref:string,
    require:true

  };
  messages:{
    type:Schema.Types.ObjectId,
    ref:string

  };
  lastMessage: IMessage | string;

}

const DialogSchema = new Schema(
  {
    partner: {type:Schema.Types.ObjectId, ref:'User'},
    author: {type:Schema.Types.ObjectId, ref:'User'},
    lastMessage:{type:Schema.Types.ObjectId, ref:'Messages'},
  },
  {
    timestamps: true,
  }
);
const DialogModel = mongoose.model<IDialog>("Dialog", DialogSchema);
export default DialogModel;