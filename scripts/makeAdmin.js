const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

const makeAdmin = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const My_EMAIL = "sahatanush05@gmail.com"
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












// To see all users run this script

// const mongoose = require("mongoose");
// require("dotenv").config();
// const User = require("../models/User");

// const makeAdmin = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);

//     // First, let's see what users exist
//     console.log("=== All Users in Database ===");
//     const allUsers = await User.find({}, "username email role");
//     console.log(allUsers);

//     if (allUsers.length === 0) {
//       console.log("❌ No users found in database!");
//       process.exit(1);
//       return;
//     }

//     // Now try to update the user
//     const MY_EMAIL = "sahatanush511@gmail.com";
//     console.log(`\n=== Looking for user with email: ${MY_EMAIL} ===`);

//     const user = await User.findOneAndUpdate(
//       { email: MY_EMAIL },
//       { role: "admin" },
//       { new: true }
//     );

//     if (user) {
//       console.log(`✅ Made ${user.username} (${user.email}) an admin.`);
//     } else {
//       console.log("❌ User not found with that email");
//       console.log("Available emails:");
//       allUsers.forEach((u) => console.log(`  - ${u.email}`));
//     }

//     mongoose.connection.close();
//     process.exit(0);
//   } catch (error) {
//     console.error("Error:", error);
//     process.exit(1);
//   }
// };

// makeAdmin();
