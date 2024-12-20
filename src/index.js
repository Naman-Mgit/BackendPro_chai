import dotenv from "dotenv";
import DBconnect from "./db/index.js";
import { app } from "./app.js";
dotenv.config()
DBconnect()
.then(()=>{
   app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT }`);       
   })
})
.catch((err)=>{
     console.log("MONGODB CONNECTION FAILED ::!!",err);
})