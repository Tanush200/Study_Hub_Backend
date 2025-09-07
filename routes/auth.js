const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.post("/register",async (req,res) => {
  try {
    const { username, email, password, profile } = req.body;

    if(!username || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if(password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username: username }]
    })

    if(existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
      profile : profile || {}
    })

    const token = jwt.sign({userId: user._id,email:user.email,role:user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});
    res.status(201).json({
      message: "User created successfully",
      token,
      user:{
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    })
  } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
  }
})


router.post("/login", async (req,res) => {
  try {
    const { email, password } = req.body;

    if(!email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const user = await User.findOne({ email });
    if(!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    } 

    const isMatch = await user.comparePassword(password);
    if(!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({userId: user._id,email:user.email,role:user.role}, process.env.JWT_SECRET, {expiresIn: '7d'});
    res.status(200).json({
      message: "Login successful",
      token,
      user:{
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    })            
  } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    
  }
})


module.exports = router;