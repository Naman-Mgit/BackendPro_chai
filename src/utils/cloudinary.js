import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadFile=async (FilePathName)=>{
     try {
        if(!FilePathName) return null;
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(FilePathName,{
            resource_type:auto
        })
        //file has been uploaded successfully
        console.log("file uploaded successfully:",response.url);
        return response;
     } catch (error) {
        fs.unlinkSync(FilePathName);
        //remove the locally saved temparory file
          //as the upload operation got failed
          return null;
     }
}