import express from "express";
import { verifyJWTToken } from "../utils";
import { DecodedData } from "../utils/verifyJWTToken";
import {JsonWebTokenError, TokenExpiredError} from 'jsonwebtoken';
export default (
  req: express.Request,
  res: express.Response, 
  next: express.NextFunction
  ) => {
  if (req.path === "/user/signin" || 
      req.path === "/user/signup"|| 
      req.path === "/user/verify"||
      req.path === "/user/recover"||
      req.path === "/refresh-tokens"||
      /public/.test(req.path)
  ) {
    return next();
  }

  const token:string | null =  "token" in req.headers ? (req.headers.token as string) : null;
  if(token){  
    try {
      verifyJWTToken(token)
      .then((user: DecodedData | any) => {       
        if(user){
          if(user.data.type !== 'access'){
            res.status(401).json({
              message:'Invalid token!'
            })
            return
          }
          req.user = user.data._doc;    
        }
        next();
      })
      .catch(() => {
        res.status(403).json({ message: "Invalid auth token provided."});
      });
    }
    catch(error){
      if(error instanceof TokenExpiredError ){
        res.status(401).json({
          message:'Token expired!'
        })
        return;
      }
      if(error instanceof JsonWebTokenError){
        res.status(401).json({
          message:'Invalid token!'
        })
        return;
      }
    }
  }
 
};