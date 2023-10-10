import jwt from 'jsonwebtoken';
import { reduce } from 'lodash';
import { uuid } from 'uuidv4';
import {TokenModel} from '../models';
interface ILoginData {
  email: string;
  password: string;
}

const generateAccessToken =  (user: ILoginData) => {
  let token = jwt.sign(
    {
      data: reduce(
        {
          ...user,
          type:'access'
        },
        (result: any, value:string, key: string) => {
          if (key !== 'password') {
            result[key] = value;
          }
          return result;
        },
        {},
      ),
    },
    process.env.JWT_SECRET || '',
    {
      expiresIn: process.env.JWT_ACCESS_MAX_AGE,
      algorithm: 'HS256',
    },
  );

  return {token:token, type:'access'};
};
const generateRefreshToken = ()=>{
  const payload = {
    id: uuid(),
    type: 'refresh'
  }
  const options = {expiresIn:process.env.JWT_REFRESH_MAX_AGE}
  return{ 
    id:payload.id,
    token: jwt.sign(payload,  process.env.JWT_SECRET || '', options  )
  }
}
const replaceDbRefreshToken = (tokenId:string, user:string)=> TokenModel.findOneAndRemove({user}).exec().then(()=>TokenModel.create({tokenId, user}))




export default {generateAccessToken, generateRefreshToken,replaceDbRefreshToken};