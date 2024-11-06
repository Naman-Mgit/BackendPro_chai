import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {stringify} from "flatted"
// STEPS TO DO REGISTRATION::-
// 1) get user details from frontend
// 2) validation - check not empty fields
// 3) check if user alredy exist using gmail and username
// 4) check for images and for avatars
// 5) Upload them on cloudinary
// 6) create user object entry in Db
// 7) remove password and refresh token field from response
// 8) check for user creation
// 9) return response 

const registerUser=asyncHandler( async (req,res)=>{
     const {fullname,email,username,password}=req.body;
     console.log("email",email);
     console.log(req.body);
     //Validation

     if ([fullname,email,username,password].some((fields)=>fields?.trim()==="")){
        throw new ApiError(400,"All fields are required")
     }
     
     // $or for checking if the user has alredy a usernmae or email
     const existedUser=await User.findOne({$or:[{ email }, { username }]})
     console.log(existedUser);
     if(existedUser){
        throw new ApiError(409,"User Alredy exist");
     }
     //req.files give acces to files which multer has uploded in the directory
     console.log(req.files);
     const avatarlocalpath=req.files?.avatar[0]?.path;
     let coverImagelocalpath;
     if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length>0){
         coverImagelocalpath=req.files?.coverimage[0]?.path;
     }
     
     if(!avatarlocalpath){
        throw new ApiError(400,"Avatar image is required");
     }
     const Avatar= await uploadonCloudinary(avatarlocalpath)
     const CoverImage= await uploadonCloudinary(coverImagelocalpath)
     console.log(Avatar);
     
     if(!Avatar){
        throw new ApiError(400,"Avatar image is required");
     }

     const user=await User.create({
         fullname,
         avatar:Avatar.url,
         coverimage:CoverImage?.url||"",
         email,
         password,
         username:username.toLowerCase()
     })
     // - sign will remove the field form object
     const createdUser=User.findById(user._id).select(
         "-password -refreshToken"
     )

     if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
     }

     
    return res.status(201).json(
        stringify(new ApiResponse(200, createdUser, "User registered Successfully"))
    )
    
})

export {registerUser}