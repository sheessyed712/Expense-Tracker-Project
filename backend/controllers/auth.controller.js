
import User from "../models/user.model.js";

export const signup=async(req,res)=>{

    try {

    const {username,email,password}=req.body;

    if(!username||!email||!password){
        return res.status(400).json({
            success:false,
            message:"All fields are required"
        })
    }

    const existingUser=await User.findOne({
        where:{
            email:email
        }
    })

    if(existingUser){
        return res.status(400).json({
            success:false,
            message:"Email already Exists"
        })
    }

    const newUser=await User.create({
        username,
        email,
        password
    });

    return res.status(201).json({
        success:true,
        message:"new user registered successfully",
        user:{
            id:newUser.id,
            username:newUser.username,
            email:newUser.email
        }
    });


 
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }


}

export const login=async(req,res)=>{

    try {
   const {email,password}=req.body;
    if(!email||!password){
        return res.status(400).json({
            success:false,
            message:"Email and password are required"
        })
    }

    const existingUser=await User.findOne({
        where:{
            email:email
        }
    });

    if(!existingUser){
        return res.status(404).json({
            status:false,
            message:"User not Found"
        })
    };

    if(existingUser.password!==password){
        return res.status(401).json({
            success:false,
            message:"Incorrect Password"
        })
    };

    return res.status(200).json({
        success:true,
        message:"User login sucessfull"
    });
  
    } catch (error) {
        console.log("login error",error);

        return res.status(500).json({
            success:false,
            message:"internal server error"
        });
    }
 


}