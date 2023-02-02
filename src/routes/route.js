const router = require("express").Router();
const { register,  getUsers, userLogin}= require("../controllers/userController") 



router.post("/register",register);
router.post("/login",userLogin);
router.get("/user/:userId/profile",getUsers);



module.exports=router