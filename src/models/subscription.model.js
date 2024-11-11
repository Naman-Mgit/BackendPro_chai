import mongoose from "mongoose"

const SubscriptionSchema=new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,// One who is subscribing
        ref:"User"
    },
    channel:{
         type:mongoose.Schema.Types.ObjectId,// One to whom a user is subscribing
         ref:"User"
    }

},{timestamps:true});

export const Subscription=mongoose.model("Subscription",SubscriptionSchema);
