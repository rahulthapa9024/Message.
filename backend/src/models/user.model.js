import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    contact:{
      type:[String],
    },
    addRequesting:{
      type:[String]
    },
    youRequseted:{
      type:[String]
    },
    myblockedList:{
      type:[String]
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
