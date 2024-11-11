import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {stringify} from "flatted"
import jwt from "jsonwebtoken"
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
const refreshAccesstoken=asyncHandler(async (req,res)=>{
     const incomingRefreshtoken=req.cookie?.refreshToken || req.body.refreshToken

     if(!incomingRefreshtoken){
        throw new ApiError(400,"Unauthorized Access");
     }
     try {
        const decodedToken=jwt.verify(incomingRefreshtoken,process.env.REFRESH_TOKEN);
   
        const user=await User.findById(decodedToken?._id);
   
        if(!user){
           throw new ApiError(401,"Invalid Refresh token");
        }
        if(incomingRefreshtoken!==user.refreshToken){
           throw new ApiError(401,"Refresh token is expired or used");
        }
        const {AccessToken,newRefreshToken}=await generateAccessandRefreshTolen(user._id);
        const options={
           httpOnly:true,
           secure:true
        }
        return res
        .status(200)
        .cookie("accessToken",AccessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
           new ApiResponse(
               200,
               {AccessToken,refreshToken:newRefreshToken},
               "user logged in successfull"
           )
        )
     } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token");
        
     }

})
const changePassword=asyncHandler(async (req,res)=>{
     const {oldpassword,newpassword}=req.body;

     
     const user=await User.findById(req.user?._id);

     const isPasswordCorrect=await user.isPasswordCorrect(oldpassword);
     if(!isPasswordCorrect){
        throw new ApiError(400,"incorrect old Password");
     }
     user.password=newpassword;
     await user.save({validateBeforeSave:false});
     
     return res
     .status(200)
     .json(
        new ApiResponse(200,{},"Password changed successfully")
     )

})
const getCurrentuser=asyncHandler(async (req,res)=>{
     return res
     .status(200)
     .json(
        new ApiResponse(200,req.user,"current User fetched successfully")
     )
})
const updateAccountDetails=asyncHandler(async (req,res)=>{
     if(!(fullname || email)){
        throw new ApiError(400,"One of the feilds is required");
     }
     const user=User.findByIdAndUpdate(req.user?._id,
         {
            $set:{
                fullname:fullname,
                email:email
            }
         },
         {new:true}

     ).select("-password")

     return res
     .status(200)
     .json(
        new ApiResponse(200,user,"Details updated successfully")
     )

})
const updateAvatar=asyncHandler(async (req,res)=>{
    const newAvatarpath=req.file?.path;
    if(!newAvatarpath){
        throw new ApiError(400,"Avatar file is missing");
    }
    const newAvatar=await uploadonCloudinary(newAvatarpath);
    if(!newAvatar.url){
        throw new ApiError(400,"Error at uploading avator on cloudinary");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{avatar:newAvatar.url}
    },{new:true}).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )

})
const updateCoverimage=asyncHandler(async (req,res)=>{
    const newCoverimagepath=req.file?.path;
    if(!newCoverimagepath){
        throw new ApiError(400,"Cover image file is missing");
    }
    const newCoverimage=await uploadonCloudinary(newCoverimagepath);
    if(!newCoverimage.url){
        throw new ApiError(400,"Error on uploading avator at cloudinary");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{ coverimage:newCoverimage.url}
    },{new:true}).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover image updated successfully")
    )

})

export {registerUser,loginUser,logoutUser,refreshAccesstoken,changePassword,getCurrentuser, updateAccountDetails,updateAvatar,updateCoverimage}