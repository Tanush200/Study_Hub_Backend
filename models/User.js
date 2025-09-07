const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Email is invalid"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role:{
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profile: {
      firstName: String,
      lastName: String,
      college: String,
      course: String,
      year: Number,
    },
    stats: {
      notesUploaded: { type: Number, default: 0 },
      totalDownloads: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
