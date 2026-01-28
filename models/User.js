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
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'pro', 'premium'],
        default: 'free'
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'past_due'],
        default: 'active'
      },
      dodoSubscriptionId: String,
      dodoCustomerId: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },

    },
    usage: {
      notesDownloadedToday: { type: Number, default: 0 },
      totalNotesDownloaded: { type: Number, default: 0 }, // For Free tier lifetime limit
      notesUploadedToday: { type: Number, default: 0 }, // For Pro tier daily limit
      questionsAskedToday: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
      privateRoomsThisMonth: { type: Number, default: 0 },
      lastMonthReset: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true,
  }
);


userSchema.pre("save", function (next) {

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


userSchema.methods.isPremium = function () {
  return this.subscription.tier === 'premium' && this.subscription.status === 'active';
}

userSchema.methods.isPro = function () {
  return (this.subscription.tier === 'pro' || this.subscription.tier === 'premium') && this.subscription.status === 'active';
}

userSchema.methods.canDownloadNote = function () {
  if (this.isPremium()) return true;

  if (this.isPro()) {
    // Pro: 10 notes per day
    const today = new Date().toDateString();
    const lastReset = new Date(this.usage.lastResetDate).toDateString();

    if (today !== lastReset) {
      this.usage.notesDownloadedToday = 0;
      this.usage.notesUploadedToday = 0; // Reset upload count too
      this.usage.questionsAskedToday = 0; // Reset question count too
      this.usage.lastResetDate = new Date();
    }
    return this.usage.notesDownloadedToday < 10;
  }

  // Free: 5 notes lifetime
  return this.usage.totalNotesDownloaded < 5;
}

userSchema.methods.canUploadNote = function () {
  if (this.isPremium()) return true;

  if (this.isPro()) {
    // Pro: 5 notes per day
    const today = new Date().toDateString();
    const lastReset = new Date(this.usage.lastResetDate).toDateString();

    if (today !== lastReset) {
      this.usage.notesDownloadedToday = 0;
      this.usage.notesUploadedToday = 0;
      this.usage.questionsAskedToday = 0;
      this.usage.lastResetDate = new Date();
    }
    return this.usage.notesUploadedToday < 5;
  }

  // Free: 5 notes lifetime
  return this.stats.notesUploaded < 5;
}

userSchema.methods.canAskQuestion = function () {
  if (this.isPro()) return true;


  const today = new Date().toDateString();
  const lastReset = new Date(this.usage.lastResetDate).toDateString();

  if (today !== lastReset) {
    this.usage.questionsAskedToday = 0;
    this.usage.notesDownloadedToday = 0; // Ensure all daily counters reset
    this.usage.notesUploadedToday = 0;
    this.usage.lastResetDate = new Date();
  }

  return this.usage.questionsAskedToday < 2;
};

userSchema.methods.canCreateRoom = function (roomCount) {
  if (this.isPremium()) return true;

  if (this.isPro()) {
    // Pro: 20 rooms lifetime
    return roomCount < 20;
  }

  // Free: 0 rooms
  return false;
};

userSchema.methods.getXPMultiplier = function () {
  return this.isPremium() ? 2 : 1
}


userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ "stats.followersCount": -1 });
userSchema.index({ "stats.reputation": -1 });
userSchema.index({ lastLogin: -1 });

module.exports = mongoose.model("User", userSchema);
