// const asyncHandler=(func)=>{
//       async (req,res,next)=>{
//           try {
//              await func(req,res,next)
//           } catch (error) {
//              res.status(error.code||500).json({
//                  success:false,
//                  message:error.message
//              })
//           }
//       }
// }



//ANOTHER WAY TO DO THIS BY PROMISES::
const asyncHandler=(requestHandler)=>{
     (req,res,next)=>{
         Promise.resolve(requestHandler(req,res,next))
         .catch((error)=>{
             next(error)
         })
     }
}

export {asyncHandler}