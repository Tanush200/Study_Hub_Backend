const adminAuth = (req,res,next) =>{
    if(!req.user){
        return res.status(401).json({message: "No token, authorization denied"});

    }

    if(req.user.role !== "admin"){
        return res.status(403).json({message: "Access denied, admin only"});
    }
    next();
}

module.exports = adminAuth;