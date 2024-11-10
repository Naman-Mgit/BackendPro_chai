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
const generateAccessandRefreshTolen=async (userId)=>{
     try {
         const user= await User.findById(userId);
         const AccessToken=user.AccessTokenGenerator();
         const RefreshToken=user.RefreshTokenGenerator();
         user.refreshToken=RefreshToken;
         await user.save({validateBeforeSave:false});

         return {AccessToken,RefreshToken};
     } 
     catch (error) {
         throw new ApiError(500,"Something went wrong while generating the token");
     }
}
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
const loginUser=asyncHandler( async (req,res)=>{
     const {username,email,password}= await req.body;
     console.log(req.body);
     
     if(!(username || email)){
         throw new ApiError(400,"username or email is required");
     }
    //  const user=await User.findOne({email})|| User.findOne({username});
     const user= await User.findOne({
          $or:[{email},{username}]
     })
     
     if(!user){
        throw new ApiError(404,"User does not exist kindly register")
     }
     const isPasswordValid=user.isPasswordCorrect(password);
     if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credintials")
     }
     const {AccessToken,RefreshToken}=await generateAccessandRefreshTolen(user._id);
     const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
     const options={
         httpOnly:true,
         secure:true,
     }
     return res
     .status(200)
     .cookie("accessToken",AccessToken,options)
     .cookie("refreshToken",RefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {
                user:loggedInUser,AccessToken,RefreshToken
             },
             "User logged in Successfully"
         )
     )
})
const logoutUser=asyncHandler(async (req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
     )
     const options={
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

export {registerUser,loginUser,logoutUser}