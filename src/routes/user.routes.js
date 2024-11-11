import Router from "express";
import {registerUser,loginUser,logoutUser,refreshAccesstoken} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'
import {verifyjwt} from '../middlewares/auth.middleware.js'

const router=Router();

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]),
    registerUser
)
router.route('/login').post(loginUser);

//secured routes
router.route('/logout').post(verifyjwt,logoutUser);
router.route('/refresh-token').post(refreshAccesstoken);

export default router;