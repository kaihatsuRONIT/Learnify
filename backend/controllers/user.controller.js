import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
export const register  = async(req,res)=>{
    try {
        const{name,email,password} = req.body;
        if(!name || !password || !email){
            return res.status(400).json({
                success: false,
                message:"All fields are required",
            })
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({
                success:false,
                message:"User already exists",
            })
        }
        const hashedPassword = await bcrypt.hash(password,10);
        await User.create({
            name,
            email,
            password:hashedPassword
        });
        return res.status(201).json({
            success:true,
            message:"Account created successfully",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message:"failed to register",
        })
    }
}
export const login  = async(req,res)=>{
    try {
        const{email,password} = req.body;
        if(!password || !email){
            return res.status(400).json({
                success: false,
                message:"All fields are required",
            })
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                success:false,
                message:"Incorrect email or password",
            })
        }
        const isPasswordMatch = await bcrypt.compare(password,user.password);
        if(!isPasswordMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect email or password",
            })
        }
        generateToken(res,user,`welcome Back ${user?.name}`)
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message:"failed to register",
        })
    }
}
export const logout = async(req,res) =>{
    try {
        return res.status(200).cookie("token","",{maxAge:0}).json({
            success:true,
            message:"Successfully Logged Out",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"failed to logout"
        })
    }
}
export const getUserProfile = async(req,res)=>{
    try {
        const userId = req.id;
        const user = await User.findById(userId).select("-password").populate("enrolledCourses");
        if(!user){
            return res.status(401).json({
                message:"User not found",
                success:false,
            })
        }
        return res.status(200).json({
            success:true,
            user,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"failed to logout"
        })
    }
}
export const updateProfile = async (req,res)=>{
    try {
        const userId = req.id;
        const {name} = req.body;
        const profilePhoto = req.file;

        const user = await User.findById(userId);
        if(!user){
            return res.status(401).json({
                message:"User not found",
                success:false,
            })
        }
        //remove old photo
        if(user?.photoUrl){
            const publicId = user?.photoUrl.split("/").pop().split(".")[0];
            deleteMediaFromCloudinary(publicId);
        }
        //add new photo
        const cloudResponse =  await uploadMedia(profilePhoto.path);
        const photoUrl = cloudResponse.secure_url;
        const updatedData = {name,photoUrl};
        const updatedUser = await User.findByIdAndUpdate(userId,updatedData,{new:true}).select("-password");
        console.log(photoUrl);

        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            user:updatedUser
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to update profile",
            success:false,
        })
        
    }
}
