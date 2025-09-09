import User from "../models/User.js"; // Assuming User model also uses ES modules
import Employers from "../models/Employers.js"; // Assuming User model also uses ES modules
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";


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
//CLIENTS TAB BEGIN
export const getClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;
    const currentDate = new Date();

    const result = await User.aggregate([
      // Step 1: Filter verified users
      {
        $match: {
          isVerified: true,
          deletedAt: null,
        },
      },
      // Step 2: Join users with their reservations
      {
        $lookup: {
          from: "reservations",
          localField: "_id",
          foreignField: "user",
          as: "reservations",
        },
      },
      // Step 3: Deconstruct the reservations array
      {
        $unwind: {
          path: "$reservations",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Step 4: Filter reservations based on status and date
      {
        $match: {
          "reservations.status": 0,
          "reservations.date": { $lt: currentDate },
        },
      },
      // Step 5: Join with the services collection to get the price
      {
        $lookup: {
          from: "services",
          localField: "reservations.service",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      // Step 6: Add servicePrice field
      {
        $addFields: {
          servicePrice: { $first: "$serviceDetails.price" },
        },
      },
      // Step 7: Group by user ID
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          image: { $first: "$image" },
          phoneNumber: { $first: "$phoneNumber" },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ["$reservations.approved", 1] }, 1, 0],
            },
          },
          skippedCount: {
            $sum: {
              $cond: [{ $eq: ["$reservations.approved", 0] }, 1, 0],
            },
          },
          totalPrice: {
            $sum: {
              $cond: [
                { $eq: ["$reservations.approved", 1] },
                "$servicePrice",
                0,
              ],
            },
          },
        },
      },
      // Step 8: Use $facet for pagination and total count in one go
      {
        $facet: {
          // Pipeline to get paginated results
          users: [{ $skip: skip }, { $limit: limit }],
          // Pipeline to get the total count
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    // Extract the results from the $facet output
    const users = result[0].users;
    const total =
      result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

    // Send the paginated data and total count in the response
    res.status(200).json({
      status: 200,
      users: users,
      totalCount: total,
      page: page,
      limit: limit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const findClient = async (req, res) => {
  try {
    const { name: partialName } = req.body;
    const userData = await User.find({
      name: { $regex: partialName, $options: "i" },
      isVerified: true,
    });
    res.status(200).json(userData);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
export const getClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const user = await User.findOne({ _id: clientId });
    const userData = {
      id: user._id,
      name: user.name,
      image: user?.image,
      phoneNumber: user?.phoneNumber,
    };
    res.status(200).json({ status: 200, userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const softDeleteUser = async (req, res) => {

  try {
    const userId = req.params.id; 
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({
      message: "User soft-deleted successfully.",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error soft-deleting user:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
//CLIENTS TAB END

//SETTINGS EDIT PROFILE ADMIN BEGIN
export const getEmployer = async (req, res) => {
  try {
    const adminId = req.params.id;

    const user = await Employers.findOne({ _id: adminId });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user?.image,
    };

    res.status(200).json({ status: 200, data: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const patchEmployer = async (req, res) => {
  try {
    const userId = req.params.id;

    // 🔐 1. Decode JWT from URL (e.g., /user/update/:token)
    const email = req.params.id;

    const user = await Employers.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { password } = req.body;

    // 🧾 3. Prepare update fields
    const updateFields = {};
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (password) updateFields.password = hashedPassword;
    // 🛠️ 4. Update user in MongoDB

    const x = await Employers.findByIdAndUpdate(user._id, updateFields, {
      new: true,
    });

    if (Object.keys(updateData).length === 0) {
      console.log("nece da moze");

      return res.status(400).json({ message: "No fields to update" });
    }

    console.log("updateData", updateData);

    const updatedUser = await Employers.findByIdAndUpdate(userId, updateData, {
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
export const logoutEmployer = async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    await logoutUserFromFirebase(decoded.id);

    return res
      .status(200)
      .json({ status: 200, message: "Employer successfully logout!" });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
  }
};

//SETTINGS EDIT PROFILE ADMIN END

//LOGIN USER ADMIN BEGIN
export const loginEmployer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Employers.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Not match password" });
    }

    const userData = {
      id: user._id,
      role: user.role,
      username: user.username,
    };

    const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });
    res.status(200).json({ status: 200, data: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//LOGIN USER ADMIN END


// Create a new user
export const createEmployer = async (req, res) => {
  
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      status: 400,
      message: "Name, email, password are required.",
    });
  }

  try {
    const existingUser = await Employers.findOne({ email });

    if (existingUser) {
      return res.status(202).json({ status: 202, message: "Email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Employers({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      isVerified: true,
    });
    await newUser.save();

    res.status(201).json({
      status: 201,
      message: "Employer created successfully!",
    });
  } catch (err) {
    res
      .status(500)
      .send({ status: 500, message: "Something Went Wrong, Please Try Again" });
  }
};

//change employers pasword
export const changeEmployerPassword = async (req, res) => {
  try {
    // 🔐 1. Decode JWT from URL (e.g., /user/update/:token)
    const email = req.params.id;

    const user = await Employers.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { password } = req.body;

    // 🧾 3. Prepare update fields
    const updateFields = {};
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (password) updateFields.password = hashedPassword;
    // 🛠️ 4. Update user in MongoDB

    const x = await Employers.findByIdAndUpdate(user._id, updateFields, {
      new: true,
    });

    // ✅ 5. Return updated user
    res.status(200).json({
      message: "Employer updated successfully new password",
      status: 200,
    });
  } catch (err) {
    console.error("Error in patchUserImage:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};