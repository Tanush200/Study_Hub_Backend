// const adminAuth = (req,res,next) =>{
//     if(!req.user){
//         return res.status(401).json({message: "No token, authorization denied"});

//     }
//       console.log("🔍 User role in adminAuth:", req.user.role);
//     if(req.user.role !== "admin"){
//         return res.status(403).json({message: "Access denied, admin only"});
//     }
//     next();
// }

// module.exports = adminAuth;




const adminAuth = (req, res, next) => {
  console.log(
    "🔍 AdminAuth check - User:",
    req.user?.username,
    "Role:",
    req.user?.role
  );

  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    console.log("❌ Access denied - Role is:", req.user.role);
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
    });
  }

  console.log("✅ Admin access granted");
  next();
};

module.exports = adminAuth;
