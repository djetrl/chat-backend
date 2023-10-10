import jwt, {VerifyErrors} from 'jsonwebtoken';
import { IUser } from '../models/User';
export interface DecodedData{ 
  data:{
    _doc:IUser;
  }
}
export default (token:string): Promise<DecodedData | null>=>
    new Promise((
       resolve:(decodedData:DecodedData)=>void,
       rejects: (err:VerifyErrors) =>void
       )=>{
          jwt.verify(
                token,
                process.env.JWT_SECRET || "", 
                (err:any,decodedData:any)=>{
                  if(err||!decodedData){
                    return rejects(err)
                  } 
                 resolve(decodedData as DecodedData)
                }
          );
  })