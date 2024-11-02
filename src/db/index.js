import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const DBconnect= async ()=>{
       try {
          const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
          console.log(`\n MongoDB connected!! DB HOSTS : ${connectionInstance.connection.host}`);
       } catch (error) {
          console.log("the error in connecting is "+error)
          process.exit(1)
       }
}
export default  DBconnect;