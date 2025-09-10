// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       minlength: 3,
//       maxlength: 30,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       match: [/\S+@\S+\.\S+/, "Email is invalid"],
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     followers:[
//      {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//      }
//     ],
//     following:[{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//     }],
//     role:{
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//     profile: {
//       firstName: String,
//       lastName: String,
//       college: String,
//       course: String,
//       year: Number,
//       bio:{ type: String, maxlength: 500},
//       avatar: String,
//       location: String,
//       website: String,
//       dateOfBirth: Date,
//       gender:{
//         type:String,
//         enum:['male','female','other','prefer not to say']
//       },
//       socialLinks: {
//         linkedin: String,
//         twitter: String,
//         github: String,
//       }
//     },
//     stats: {
//       notesUploaded: { type: Number, default: 0 },
//       totalDownloads: { type: Number, default: 0 },
//       totalViews: { type: Number, default: 0 },
//       reputation: { type: Number, default: 0 },
//       followersCount: { type: Number, default: 0 },
//       followingCount: { type: Number, default: 0 },
//       studyStreak: { type: Number, default: 0 },
//       totalStudyTime: { type: Number, default: 0 }, 
//     },
//     privacy:{
//       profileVisibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
//       allowFollowRequests: { type: Boolean, default: true },
//     }
//   },
//   {
//     timestamps: true,
//   }
// );

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });


// userSchema.methods.comparePassword = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// userSchema.index({ followers: 1 });
// userSchema.index({ following: 1 });

// module.exports = mongoose.model("User", userSchema);



// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       minlength: 3,
//       maxlength: 30,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       match: [/\S+@\S+\.\S+/, "Email is invalid"],
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     xp: {
//       type: Number,
//       default: 0,
//     },
//     level: {
//       type: Number,
//       default: 1,
//     },
//     badges: [
//       {
//         badgeId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Badge",
//         },
//         earnedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],

//     challengeProgress: [
//       {
//         challengeId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Challenge",
//         },
//         progress: {
//           type: Number,
//           default: 0,
//         },
//         completed: {
//           type: Boolean,
//           default: false,
//         },
//         completedAt: Date,
//       },
//     ],

    

//     followers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     following: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//     profile: {
//       firstName: String,
//       lastName: String,
//       college: String,
//       course: String,
//       year: Number,
//       bio: { type: String, maxlength: 500 },
//       avatar: String,
//       location: String,
//       website: String,
//       dateOfBirth: Date,
//       gender: {
//         type: String,
//         enum: ["male", "female", "other", "prefer-not-to-say"], // ✅ Fixed enum value
//       },
//       socialLinks: {
//         linkedin: String,
//         twitter: String,
//         github: String,
//       },
//     },
//     stats: {
//       notesUploaded: { type: Number, default: 0 },
//       totalDownloads: { type: Number, default: 0 },
//       totalViews: { type: Number, default: 0 },
//       reputation: { type: Number, default: 0 },
//       followersCount: { type: Number, default: 0 },
//       followingCount: { type: Number, default: 0 },
//       studyStreak: { type: Number, default: 0 },
//       totalStudyTime: { type: Number, default: 0 },
//     },
//     privacy: {
//       profileVisibility: {
//         type: String,
//         enum: ["public", "followers", "private"],
//         default: "public",
//       },
//       allowFollowRequests: { type: Boolean, default: true },
//     },

//     // ✅ Optional: Add these for better functionality
//     isActive: { type: Boolean, default: true },
//     lastLogin: Date,
//   },
//   {
//     timestamps: true,
//   }
// );



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

    // ✅ Gamification Fields
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: [
      {
        badgeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Badge",
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ✅ Challenge Progress (NEW)
    challengeProgress: [
      {
        challengeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Challenge",
        },
        progress: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],

    // ✅ Monthly Stats (NEW)
    monthlyStats: {
      currentMonth: String, // "2025-09"
      monthlyXP: { type: Number, default: 0 },
      notesUploaded: { type: Number, default: 0 },
      notesReviewed: { type: Number, default: 0 },
      lastStudyDate: Date,
    },

    // Existing fields...
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    role: {
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
      bio: { type: String, maxlength: 500 },
      avatar: String,
      location: String,
      website: String,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer-not-to-say"],
      },
      socialLinks: {
        linkedin: String,
        twitter: String,
        github: String,
      },
    },
    stats: {
      notesUploaded: { type: Number, default: 0 },
      totalDownloads: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      studyStreak: { type: Number, default: 0 },
      totalStudyTime: { type: Number, default: 0 },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "followers", "private"],
        default: "public",
      },
      allowFollowRequests: { type: Boolean, default: true },
    },

    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// ✅ Add validation to prevent self-follow
userSchema.pre("save", function (next) {
  // Remove self from followers/following arrays if somehow added
  this.followers = this.followers.filter((id) => !id.equals(this._id));
  this.following = this.following.filter((id) => !id.equals(this._id));
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.virtual("calculatedLevel").get(function () {
  return Math.floor(this.xp / 100) + 1;
});

userSchema.virtual("xpForNextLevel").get(function () {
  const currentLevel = Math.floor(this.xp / 100) + 1;
  return currentLevel * 100 - this.xp;
});

userSchema.virtual("levelProgress").get(function () {
  const currentLevelXP = this.xp % 100;
  return currentLevelXP;
});


userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ "stats.followersCount": -1 }); 
userSchema.index({ "stats.reputation": -1 }); 
userSchema.index({ lastLogin: -1 });

module.exports = mongoose.model("User", userSchema);
