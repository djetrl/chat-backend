import mongoose,{ Schema,Document } from "mongoose";
import differenceInMinutes from 'date-fns/differenceInMinutes'
import  validator from 'validator';
import { generatePasswordHash } from "../utils";
import { IUploadFile } from "./UploadFile";
export interface IUser extends Document{
  email:string;
  fullname:string;
  password:string;
  confirmed:boolean;
  avatar:IUploadFile | string;
  confirm_hash:string;
  last_seen:Date;
  data?:IUser
}
const UserSchema = new Schema(
  {
    email: {
      type: String,
      require: "Email address is required",
      validate: [validator.isEmail, "Invalid email"],
      index: {unique: true},
      
    },
    fullname: { 
      type: String,
      required: "Fullname is required", 
    },
    password: {
      type: String,
      required: "Password is required"
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    avatar: [{type:Schema.Types.ObjectId, ref:'UploadFile'}],
    confirm_hash: String,
    last_seen: {
      type: Date,
      default: new Date(),
    },
  },
  {
    timestamps: true,
  }
);
UserSchema.virtual('isOnline').get(function(this:any){
  return differenceInMinutes(new Date(),this.last_seen) < 5
})
UserSchema.set('toJSON',{
  virtuals:true
})
UserSchema.pre<IUser>("save", async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;

  if (!user.isModified("password")) {
    return next();
  }

  user.password = await generatePasswordHash(user.password || '');
  user.confirm_hash = await generatePasswordHash(new Date().toString());
});
const UserModel = mongoose.model<IUser>("User", UserSchema);

export default UserModel;