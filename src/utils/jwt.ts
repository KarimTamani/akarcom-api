import { sign } from "jsonwebtoken"
import config from "../config/config";
import crypto from "crypto" ; 

export const createToken = async(identifier, password) => {
    return await sign({ identifier, password }, config.JWT_SECRET, {
        expiresIn: "99 years"
    })
} 



export function generateRandomPassword(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }