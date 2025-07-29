import User from "../models/User.js"; // Assuming User model also uses ES modules
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path"; // Needed for path.extname in multer
import { put } from "@vercel/blob";
import multer from "multer";
import { prettyUrlDataImage } from "../helpers/utils.js";
import otpGenerator from "otp-generator";
import VerificationOtpCode from "../models/OtpModel.js"; // Assuming User model also uses ES modules
import axios from "axios";

// export const patchUser = async (req, res) => {
//   try {

//     const token = req.params.id;

//     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//     console.log("decoded+++", decoded,req.body);

//     const { name, image } = req.body.params;

//     const user = await User.findByIdAndUpdate(
//       decoded.id,
//       { name, image },
//       { new: true }
//     );
//     if (!user) {
//       return res.status(404).send("User not found");
//     }

//     res.status(200).json({ message: "User updated successfully" });
//   } catch (error) {
//     res.status(500).send("Server Error");
//   }
// };

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
    // const checkUserPresent = await User.findOne({ email });

    // if (!checkUserPresent) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Wrong email",
    //     status: 400,
    //   });
    // }
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

    await sendEmail({ receipients, subject, message });

    // const subject = "Registration";

    // const message = "Please enter your otp code 3212";

    // const receipients = `${name} <${email}>`;
    // await sendEmail({ receipients, subject, message });

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
    res
      .status(200)
      .json({ message: "Your account has been verified! You can now log in." });
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
      return res.status(202).json({ status: 202, message: "Not verified" });
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

// const uploadMiddleware = multer({
//   storage: multer.memoryStorage(), // Store the file in memory
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (5 * 1024 * 1024 bytes)
//   fileFilter: function (req, file, cb) {
//     // Define a regular expression to allow only common image file types (JPEG, JPG, PNG, GIF)
//     const filetypes = /jpeg|jpg|png|gif/;
//     // Test the file's MIME type against the allowed types
//     const mimetype = filetypes.test(file.mimetype);
//     // Test the file's extension (converted to lowercase) against the allowed types
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );

//     if (mimetype && extname) {
//       return cb(null, true); // If both MIME type and extension are valid, accept the file
//     } else {
//       // If the file is not an allowed image type, reject it with an error message
//       cb(new Error("Only images (JPEG, PNG, GIF) are allowed!"));
//     }
//   },
// });
// export const uploadUserImage = uploadMiddleware.single("image");

// export const uploadImage = async (req, res) => {
//   // Check if a file was successfully attached to the request by Multer.
//   // This could be null if no file was sent, or if the field name was incorrect.
//   if (!req.file) {
//     return res.status(400).json({
//       message: "No file selected for upload or incorrect field name.",
//     });
//   }

//   // Retrieve the Vercel Blob Read/Write Token from environment variables.
//   // This token is essential for authenticating your application with Vercel Blob Storage.
//   // Make sure to configure BLOB_READ_WRITE_TOKEN in your .env file for local development
//   // and in your Vercel project settings for deployment.
//   const vercelBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

//   // If the Vercel Blob token is not configured, send a server configuration error.
//   if (!vercelBlobToken) {
//     console.error(
//       "Vercel Blob token is not set. Please set BLOB_READ_WRITE_TOKEN environment variable."
//     );
//     return res.status(500).json({
//       message: "Server configuration error: Vercel Blob token missing.",
//     });
//   }

//   try {
//     // Call the `put` function from the @vercel/blob SDK to upload the file buffer.
//     // `req.file.originalname` is used as the desired filename in Vercel Blob storage.
//     // `req.file.buffer` contains the binary content of the uploaded image.
//     const blob = await put(req.file.originalname, req.file.buffer, {
//       access: "public", // Set the access level to 'public' so the image can be viewed via its URL
//       token: vercelBlobToken, // Pass the authentication token
//       contentType: req.file.mimetype, // Set the appropriate MIME type for the uploaded file
//     });

//     console.log("File uploaded to Vercel Blob successfully. URL:", blob.url);
//     // Send a successful JSON response back to the client, including the Blob's public URL.
//     res.status(200).json({
//       message: "File uploaded to Vercel Blob successfully!",
//       filename: req.file.originalname,
//       blobUrl: blob.url, // The publicly accessible URL of the uploaded image
//       pathname: blob.pathname, // The unique path of the blob within your Vercel storage
//     });
//   } catch (blobError) {
//     // Catch and log any errors that occur during the actual upload to Vercel Blob
//     console.error("Error uploading to Vercel Blob:", blobError);
//     // Send a 500 status code indicating an internal server error during the upload process
//     res.status(500).json({
//       message: `Failed to upload to Vercel Blob: ${blobError.message}`,
//     });
//   }
// };

// 1. Upload middleware (for single file upload)
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only images (JPEG, PNG, GIF) are allowed!"));
  },
});

// 2. Export multer middleware to use in route
export const uploadUserImage = uploadMiddleware.single("image");

// 3. Unified controller
export const patchUser = async (req, res) => {
  try {
    // 🔐 1. Decode JWT from URL (e.g., /user/update/:token)
    const token = req.params.id;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const { name, phoneNumber } = req.body;

    let imageUrl = null;

    // 🖼️ 2. If image is included, upload to Vercel Blob
    if (req.file) {
      const vercelBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!vercelBlobToken) {
        return res.status(500).json({ message: "Missing Vercel Blob token" });
      }

      const blob = await put(req.file.originalname, req.file.buffer, {
        access: "public",
        token: vercelBlobToken,
        contentType: req.file.mimetype,
        allowOverwrite: true, // ✅ This will overwrite the existing file
      });

      imageUrl = blob.url; // This becomes the new image URL
    }

    // 🧾 3. Prepare update fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (imageUrl) updateFields.image = imageUrl;

    // 🛠️ 4. Update user in MongoDB
    const user = await User.findByIdAndUpdate(decoded.id, updateFields, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ 5. Return updated user
    res.status(200).json({
      message: "User updated successfully",
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
      console.log("solve", res.data.message);
    })
    .catch((err) => {
      console.log("err", err);
    });
}
export const sendOTP = async (req, res) => {
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

    let result = await VerificationOtpCode.findOne({ otp: otpCode, email });

    if (result) {
      res.status(200).json({
        success: true,
        message: `Your otp code is valid`,
        otp,
        status: 200,
      });
    } else {
      res.status(300).json({
        success: true,
        message: `Your otp code is invalid`,
        otp,
        status: 300,
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
