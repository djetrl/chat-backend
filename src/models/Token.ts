import mongoose,{ Schema,Document } from "mongoose";
import { IUser } from "./User";
export interface IToken extends Document{
  tokenId:string;
  user:IUser | string;
}
const TokenSchema = new Schema(
  {
    tokenId:{type:String, required: "tokenId is required"},
    user:{type:Schema.Types.ObjectId, ref:'User',require:true},
  },
  {
    timestamps: true,
    usePushEach: true
  }
);

const DialogModel = mongoose.model<IToken>("Token", TokenSchema);

export default DialogModel;