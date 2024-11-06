import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config()
// Configuration
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});
console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_API_SECRET);


const uploadonCloudinary=async (FilePathName)=>{
     try {
         console.log("path name in cloudinary is",FilePathName);
         console.log(process.env.CLOUDINARY_CLOUD_NAME);
         console.log(process.env.CLOUDINARY_API_KEY);
         console.log(process.env.CLOUDINARY_API_SECRET); 
         
        if(!FilePathName) return null;
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(FilePathName,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        fs.unlinkSync(FilePathName)
        return response;
     } catch (error) {
        console.log(error);
        
        fs.unlinkSync(FilePathName);
        //remove the locally saved temparory file
          //as the upload operation got failed
          return null;
     }
}
export {uploadonCloudinary}