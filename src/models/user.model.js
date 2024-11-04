import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //Cloudinary url
        required:true
    },
    coverimage:{
        type:String, 
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})

UserSchema.pre("save",async function(next){
     if(!this.isModified("password")) return next();
     this.password=await bcrypt.hash(this.password,10);
     next();
})
UserSchema.methods.isPasswordCorrect=async function(password){
     return await bcrypt.compare(password,this.password);
}
UserSchema.methods.AccessTokenGenerator=function() {
      return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        
      )
}
UserSchema.methods.RefreshTokenGenerator=function() {
      return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
        
      )
}
export const User=mongoose.model("User",UserSchema);