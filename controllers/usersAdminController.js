import User from "../models/User.js"; // Assuming User model also uses ES modules
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import fetch from "node-fetch";

import path from "path"; // Needed for path.extname in multer
import { put } from "@vercel/blob";
import multer from "multer";
import otpGenerator from "otp-generator";
import VerificationOtpCode from "../models/OtpModel.js"; // Assuming User model also uses ES modules
import axios from "axios";

// 3. Unified controller

export const patchUser = async (req, res) => {
  try {
    const userDataId = req.params.id;
    const decoded = jwt.verify(userDataId, process.env.JWT_SECRET_KEY);
    const { id: userId } = decoded;

    const { name, phoneNumber } = req.body;
    const updateData = {};
    if (name !== "null") {
      updateData.name = name;
    }

    if (phoneNumber === "+381") {
      updateData.phoneNumber = "";
    } else if (phoneNumber !== "null" && phoneNumber !== null) {
      updateData.phoneNumber = phoneNumber;
    }

    if (req.file && req.file.buffer) {
      console.log("kdaskdaskdasd i ti a");

      const fileName = `${Date.now()}-${req.file.originalname}`;

      // ✅ Upload to Vercel Blob using SDK
      const blob = await put(fileName, req.file.buffer, {
        access: "public", // 👈 MAKE IT PUBLIC
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      updateData.image = blob.url; // ✅ This is a public URL
    }

    if (Object.keys(updateData).length === 0) {
      console.log("nece da moze");

      return res.status(400).json({ message: "No fields to update" });
    }

    console.log("updateData", updateData);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in patchUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    await logoutUserFromFirebase(decoded.id);

    return res
      .status(200)
      .json({ status: 200, message: "User successfully logout!" });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
  }
};

// Create a new user
export const createAdmin = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, password are required.",
    });
  }

  try {
    // Check if user with email already exists

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(202).json({ message: "Email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      isVerified: false,
    });
    await newUser.save();

    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + 40); // Add 10 seconds
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await VerificationOtpCode.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await VerificationOtpCode.findOne({ otp: otp });
    }

    const otpPayload = { email, otp, expireAt: expirationTime };
    await VerificationOtpCode.create(otpPayload);

    const subject = "Registration";

    const message = `Your otp code is ${otp}`;

    const receipients = email;

    await sendEmail({ receipients, subject, message })
      .then((result) => {
        if (result.status === 200) {
          return res.status(200).json({
            success: true,
            message: "User created successfully! Please verified your account.",
            status: 200,
          });
        }
        if (result.status === 500) {
          return res.status(500).json({
            success: false,
            message: result.text,
            status: 500,
          });
        }
        if (result.status === 404) {
          return res.status(500).json({
            success: false,
            message: result.text,
            status: 500,
          });
        }
      })
      .catch((err) => {
        return res.status(500).json({
          success: false,
          message: err,
          status: 500,
        });
      });

    res.status(201).json({
      message: "User created successfully! Please verified your account.",
    });
  } catch (err) {
    res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
  }
};

//loginAdminUser
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user in the "database"
    const user = await User.findOne({ email }); // `findOne` is typically better if you expect a single result

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the password with the hashed password stored in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Not match password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Not verified" });
    }

    if (user.role !== "administrator") {
      if (user.role !== "employer") {
        return res.status(400).json({ message: "Not permission" });
      }
    }

    const userData = {
      id: user._id,
      role: user.role,
    };

    // Create JWT token
    const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });
    res.status(200).json({ token });
    // Send the token as a response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getClients = async (req, res) => {
  try {
    // const users = await User.find({
    //   role: { $exists: false },
    //   isVerified: true,
    // });
    // const usersData = users.map((user) => {
    //   return {
    //     id: user._id,
    //     name: user.name,
    //     image: user.image,
    //   };
    // });
    const currentDate = new Date();
    const userApprovedStatusCounts = await User.aggregate([
      {
        $match: {
          isVerified: true,
        },
      },
      {
        $lookup: {
          from: "reservations",
          localField: "_id",
          foreignField: "user",
          as: "reservations",
        },
      },
      {
        $unwind: {
          path: "$reservations",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          // Create a normalized status based on 'approved' field
          reservationApprovedStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$reservations.approved", 1] },
                  then: "approved",
                },
                {
                  case: { $eq: ["$reservations.approved", 0] },
                  then: "skipped",
                }, // Using "skipped" to avoid confusion with "skip" operation
              ],
              default: "no_reservation", // For users with no reservations or null 'approved' field
            },
          },
        },
      },
      {
        $match: {
          "reservations.status": 0,
          "reservations.date": { $lt: currentDate },
        },
      },
      {
        $group: {
          _id: "$_id", // Group by user ID
          name: { $first: "$name" }, // Get the user's name
          approvedCount: {
            $sum: {
              $cond: [
                { $eq: ["$reservationApprovedStatus", "approved"] },
                1,
                0,
              ],
            },
          },
          skippedCount: {
            $sum: {
              $cond: [{ $eq: ["$reservationApprovedStatus", "skipped"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          // Project to clean up the output and remove noReservationCount if it's 0
          _id: 1,
          name: 1,
          approvedCount: 1,
          skippedCount: 1,
          // Only include noReservationCount if it's greater than 0, otherwise it means the user had reservations
          noReservationCount: {
            $cond: [
              { $gt: ["$noReservationCount", 0] },
              "$noReservationCount",
              "$$REMOVE",
            ],
          },
        },
      },
    ]);

    console.log(userApprovedStatusCounts);
    res.status(200).json({ status: 200, data: userApprovedStatusCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const geAdmin = async (req, res) => {
  try {
    const token = req.params.id;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("getUser++", token);

    const user = await User.findOne({ _id: decoded.id });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user?.image,
      phoneNumber: user?.phoneNumber,
    };

    res.status(200).json({ status: 200, data: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getClient = async (req, res) => {
  try {
    const token = req.params.id;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("getUser++", token);

    const user = await User.findOne({ _id: decoded.id });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user?.image,
      phoneNumber: user?.phoneNumber,
    };

    res.status(200).json({ status: 200, data: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Unified controller
export const changeUserPassword = async (req, res) => {
  try {
    // 🔐 1. Decode JWT from URL (e.g., /user/update/:token)
    const email = req.params.id;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { password } = req.body;

    // 🧾 3. Prepare update fields
    const updateFields = {};
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (password) updateFields.password = hashedPassword;
    // 🛠️ 4. Update user in MongoDB

    const x = await User.findByIdAndUpdate(user._id, updateFields, {
      new: true,
    });

    // ✅ 5. Return updated user
    res.status(200).json({
      message: "User updated successfully new password",
      status: 200,
    });
  } catch (err) {
    console.error("Error in patchUserImage:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
