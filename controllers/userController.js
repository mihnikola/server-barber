import User from "../models/User.js"; // Assuming User model also uses ES modules
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import fetch from "node-fetch";

import path from "path"; // Needed for path.extname in multer
import { put } from "@vercel/blob";
import multer from "multer";
import { prettyUrlDataImage } from "../helpers/utils.js";
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

    console.log("object", name, phoneNumber);
    if (name !== "null") {
      console.log("name", name);
      updateData.name = name;
    }
    if (phoneNumber !== "null" && phoneNumber !== null) {
      console.log("phoneNumber", phoneNumber);
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
export const loginVerify = async (req, res) => {

  const { email, password, otpCode } = req.body;

  let result = await VerificationOtpCode.findOne({ otp: otpCode, email });

  if (!result) {
    return res
      .status(202)
      .json({ status: 202, message: "Your otp code is not valid" });
  }
  // Find the user in the "database"
  const user = await User.findOne({ email }); // `findOne` is typically better if you expect a single result

  if (!user) {
    return res
      .status(202)
      .json({ status: 202, message: "Incorrect email or password" });
  }

  // Compare the password with the hashed password stored in the database
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(202).json({ status: 202, message: "Incorrect password" });
  }

  user.isVerified = true;
  await user.save();
  // const updateFields = {};
  // updateFields.isVerified = true;

  // await User.findByIdAndUpdate(user._id, updateFields, {
  //   new: true,
  // });

  const userData = {
    id: user._id.toHexString(),
    email: user.email,
  };

  // Create JWT token
  const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
    expiresIn: "10000000m",
  });
  res.status(200).json({
    status: 69,
    token,
    userId: user._id,
    message: "Your account has been verified! Welcome to hell!",
  });
};
// Create a new admin user
export const createAdminUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: true,
      role: "",
    });
    await newUser.save();
    res.status(201).json({
      message: "User created successfully!",
    });
  } catch (err) {
    console.error("Error:", err); // Log error to console
    res.status(500).json({ error: err.message });
  }
};

// Create a new user
export const createUser = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({
      message: "Name, email, password and phone number are required.",
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

    console.log("Registration+++", otp);

    await sendEmail({ receipients, subject, message });

    res.status(201).json({
      message: "User created successfully! Please verified your account.",
    });
  } catch (err) {
    res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
  }
};

export const verifyEmail = async (req, res) => {
  const email = req.query["params[email]"];
  const otpCode = req.query["params[otpCode]"];
  try {
    // Verify the token using the secret key

    // Find the user with the decoded email
    const user = await User.findOne({ email });
    let result = await VerificationOtpCode.findOne({ otp: otpCode, email });
    if (!result) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification otp code." });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified." });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();
    res.status(200).json({
      status: 200,
      message: "Your account has been verified! You can now log in.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify the token." });
  }
};

//loginAdminUser
export const loginAdminUser = async (req, res) => {
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

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find the user in the "database"
    const user = await User.findOne({ email }); // `findOne` is typically better if you expect a single result

    if (!user) {
      return res
        .status(202)
        .json({ status: 202, message: "Incorrect email or password" });
    }

    // Compare the password with the hashed password stored in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(202)
        .json({ status: 202, message: "Incorrect password" });
    }

    if (!user.isVerified) {
      return res.status(202).json({ status: 606, message: "Not verified" });
    }
    const userData = {
      id: user._id.toHexString(),
      email: user.email,
    };

    // Create JWT token
    const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });
    res.status(200).json({ status: 200, token, userId: user._id });
  } catch (err) {
    res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $exists: true, $ne: null } });
    const usersData = users.map((user) => {
      return {
        id: user._id,
        name: user.name,
        role: user.role,
        image: prettyUrlDataImage(`${process.env.API_URL}/${user.image}`),
      };
    });
    res.status(200).json({ status: 200, data: usersData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const token = req.params.id;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
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
async function sendEmail(receipients) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/sendMail";
  console.log("receipients", receipients);
  await axios
    .post(functionUrl, {
      to: receipients.receipients,
      subject: receipients.subject,
      text: receipients.message,
      html: receipients.message,
    })
    .then((res) => {
      console.log("solve", res);
    })
    .catch((err) => {
      console.log("err", err);
    });
}
export const sendOTP = async (req, res) => {
  console.log("gde si oziii");
  try {
    const email = req.query["params[email]"];
    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + 40); // Add 10 seconds
    const checkUserPresent = await User.findOne({ email });

    if (!checkUserPresent) {
      return res.status(400).json({
        success: false,
        message: "Wrong email",
        status: 400,
      });
    }
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

    const subject = "Forgot password";

    const message = `Your otp code is ${otp}`;

    const receipients = email;

    console.log("object", otp);

    await sendEmail({ receipients, subject, message });

    res.status(200).json({
      success: true,
      message: `OTP code sent successfully on email ${email}`,
      otp,
      status: 200,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const sendOTPviaLogin = async (req, res) => {
  try {
    const email = req.query["params[email]"];

    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + 20); // Add 10 seconds
    const checkUserPresent = await User.findOne({ email });

    if (!checkUserPresent) {
      return res.status(400).json({
        success: false,
        message: "Wrong email",
        status: 400,
      });
    }
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

    console.log("object", otp);

    await sendEmail({ receipients, subject, message });

    res.status(200).json({
      success: true,
      message: `OTP code sent successfully on email ${email}`,
      otp,
      status: 200,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyOtpCode = async (req, res) => {
  try {
    const email = req.query["params[email]"];
    const otpCode = req.query["params[otpCode]"];
    console.log("email otpCode", otpCode, email);

    let result = await VerificationOtpCode.findOne({ otp: otpCode, email });
    console.log("object", result);

    if (result) {
      res.status(200).json({
        success: true,
        message: `Your otp code is valid`,
        status: 200,
      });
    } else {
      res.status(300).json({
        success: true,
        message: `Your otp code is invalid`,
        status: 300,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
