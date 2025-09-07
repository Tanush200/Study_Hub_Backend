const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

const makeAdmin = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const My_EMAIL = 'sahatanush511@gmail.com';
        const user = await User.findOneAndUpdate(
        { email: My_EMAIL},
        { role: "admin" },
        {new:true}
        );
        if(user) {
            console.log(`Made ${user.username} ${user.email} an admin.`);

            
        }else{
            console.log("User not found");
        }
        process.exit(0)
    } catch (error) {
         console.error("Error:", error);
         process.exit(1);
    }
};

makeAdmin();