import User from "../models/User.js"; // Assuming User model also uses ES modules
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import otpGenerator from "otp-generator";
import VerificationOtpCode from "../models/OtpModel.js"; // Assuming User model also uses ES modules
import axios from "axios";
import EmployersServices from "../models/EmployersServices.js";
import Rating from "../models/Rating.js";
import Availability from "../models/Availability.js";

async function changeLanguageFirebase(data) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addOrUpdateLanguageLocalization";
  const responseEmail = await axios
    .post(functionUrl, data)
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return { status: err.status, text: "Something goes wrong!" };
    });

  return responseEmail;
}
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
    message: "Your account has been verified!",
  });
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

    const subject = "Account validation";

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

export const verifyEmail = async (req, res) => {
  const email = req.query["email"];
  const otpCode = req.query["otpCode"];
  try {
    // Verify the token using the secret key

    // Find the user with the decoded email
    const user = await User.findOne({ email });
    let result = await VerificationOtpCode.findOne({ otp: otpCode, email });
    if (!result) {
      return res.status(400).json({
        status: 401,
        error: "Invalid or expired verification otp code.",
      });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ status: 403, error: "User already verified." });
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

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password, expoToken } = req.body;
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
      return res.status(202).json({
        status: 606,
        message:
          "Your account is not verified yet. Verification code will be sent to your email.",
      });
    }
    const userData = {
      id: user._id.toHexString(),
      token: expoToken,
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

//Login & Create User
export const loginViaGoogle = async (req, res) => {
  try {
    const { user, expoToken } = req.body;

    const { email, name, id, photo } = user;

    let userData = await User.findOne({ email }); // `findOne` is typically better if you expect a single result

    if (!userData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(id, salt);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        isVerified: true,
        image: photo,
      });

      userData = await newUser.save();
    }

    const userDataToken = {
      id: userData._id.toHexString(),
      token: expoToken,
      email: userData.email,
    };

    const token = jwt.sign(userDataToken, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });

    return res.status(200).json({
      status: 200,
      token,
      message: "Login Successfully",
      userId: userData._id,
    });
  } catch (err) {
    return res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
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

export const changeLanguage = async (req, res) => {
  try {
    const tokenData = req.params.id;

    console.log("changeLanguage+++", tokenData);

    const decoded = jwt.verify(tokenData, process.env.JWT_SECRET_KEY);
    const { id, token } = decoded;
    const { langData } = req.body;

    const contentData = { userId: id, token, lang: langData };
    await changeLanguageFirebase(contentData)
      .then((result) => {
        return res.status(200).json({
          success: true,
          message: `Successfully updated language`,
          status: 200,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          success: false,
          message: err,
          status: 500,
        });
      });

    res.status(200).json({
      message: "User updated successfully jabadaba language",
      status: 200,
    });
  } catch (err) {
    console.error("Error in xxxxxxxxxx:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

async function sendEmail(receipients) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/sendMail";
  const responseEmail = await axios
    .post(functionUrl, {
      to: receipients.receipients,
      subject: receipients.subject,
      text: receipients.message,
      html: receipients.message,
    })
    .then((res) => {
      if (res.status === 200) {
        return { status: res.status, text: res.statusText };
      }
    })
    .catch((err) => {
      return { status: err.status, text: "Something goes wrong!" };
    });

  return responseEmail;
}
async function logoutUserFromFirebase(userId) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/logoutUserFromFirebase";
  await axios
    .post(functionUrl, { userId })
    .then((res) => {
      console.log("logoutUserFromFirebase solve", res.data.message);
    })
    .catch((err) => {
      console.log("logoutUserFromFirebase err", err);
    });
}
export const sendOTP = async (req, res) => {
  const lang = req.headers["language"];

  try {
    const email = req.query["params[email]"];
    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + 40); // Add 10 seconds
    const checkUserPresent = await User.findOne({ email });
    if (!checkUserPresent) {
      return res.status(200).json({
        success: false,
        status: 200,
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

    let subject = "";
    let message = "";
    if (lang === "en") {
      subject = "Account validation";
      message = `Your otp code is ${otp}`;
    } else {
      subject = "Validacija naloga";
      message = `Vaš otp kod je ${otp}`;
    }

    const receipients = email;

    await sendEmail({ receipients, subject, message })
      .then((result) => {
        if (result.status === 200) {
          return res.status(200).json({ success: true, status: 200 });
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

    const subject = "Account validation";

    const message = `Your otp code is ${otp}`;

    const receipients = email;

    await sendEmail({ receipients, subject, message })
      .then((result) => {
        if (result.status === 200) {
          return res.status(200).json({
            success: true,
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
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyOtpCode = async (req, res) => {
  try {
    const email = req.query["email"];
    const otpCode = req.query["otpCode"];

    let result = await VerificationOtpCode.findOne({ otp: otpCode, email });
    console.log("object", email, otpCode);

    if (result === null) {
      res.status(300).json({
        success: false,
        message: `Your otp code is invalid`,
        status: 300,
      });
    } else {
      res.status(200).json({
        success: true,
        message: `Your otp code is valid`,
        status: 200,
      });
    }
  } catch (error) {
    console.log("email bhcvgv", otpCode, email, result);

    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmployers = async (req, res) => {
  const placeId =
    req.query["location[0][id]"] ||
    req.query["location[location][id]"] ||
    req.query["location[id]"];
  const serviceId = req.query["service[serviceId]"];

  try {
    const employerServiceLinks = await EmployersServices.find({
      services: serviceId,
    }).populate({
      path: "employers",
      populate: { path: "seniority" },
    });

    // 1. Ekstrahuj sve employere iz veza
    const allEmployers = employerServiceLinks.flatMap(
      (item) => item.employers || []
    );
    // 2. Filtriraj po placeId
    const filteredEmployers = allEmployers.filter(
      (emp) => emp.place?.toString() === placeId
    );

    // 3. Pripremi listu employerId-jeva
    const employerIds = filteredEmployers.map((emp) => emp._id);

    // 4. Dobavi ocene i broj korisnika za te employere preko Availability
    // const aggregatedData = await Availability.aggregate([
    //   {
    //     $match: {
    //       employer: { $in: employerIds },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "ratings",
    //       localField: "rating",
    //       foreignField: "_id",
    //       as: "ratingInfo",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$ratingInfo",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $match: {
    //       ratingInfo: { $ne: null }, // <-- Ovo je dodatak
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$employer",
    //       averageRating: { $avg: "$ratingInfo.rate" },
    //       userSet: { $addToSet: "$user" },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       averageRating: 1,
    //       userCount: { $size: "$userSet" },
    //     },
    //   },
    // ]);

    const aggregatedData = await Availability.aggregate([
      {
        $match: {
          employer: { $in: employerIds },
        },
      },
      {
        $lookup: {
          from: "ratings",
          localField: "rating",
          foreignField: "_id",
          as: "ratingInfo",
        },
      },
      {
        $unwind: {
          path: "$ratingInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ratingInfo: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$employer",
          averageRating: { $avg: "$ratingInfo.rate" },
          totalRating: { $sum: "$ratingInfo.rate" },
          ratingCount: { $sum: 1 },
          users: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          _id: 1,
          averageRating: 1,
          totalRating: 1,
          ratingCount: 1,
          users: 1,
        },
      },
    ]);
    let result;
    if (aggregatedData?.length === 0) {
      result = filteredEmployers.map((user) => {
        return {
          id: user._id,
          name: user.name,
          image: user.image,
          seniority: user?.seniority?.title || null,
          averageRating: 0,
          userCount: 0,
        };
      });
    } else {
      const aggregationMap = {};
      aggregatedData.forEach((item) => {
        aggregationMap[item._id.toString()] = {
          _id: item._id,
          averageRating: item.averageRating || 0,
          userCount: item.users?.length || 0,
        };
      });
      result = filteredEmployers.map((user) => {
        const stats = aggregationMap[user._id.toString()] || {};
        return {
          id: user._id,
          name: user.name,
          image: user.image,
          seniority: user?.seniority?.title || null,
          averageRating: stats.averageRating || 0,
          userCount: stats.userCount || 0,
        };
      });
    }
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
