
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
export default (token:string)=>
    new Promise((resolve, rejects)=>{
    jwt.verify(token,process.env.JWT_SECRET || "", (err,decodedData)=>{
      if(err||!decodedData){
        return rejects(err)
      } 
      resolve(decodedData)
    })
  })
