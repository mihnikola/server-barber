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
    // const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    // const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    // const skip = (page - 1) * limit;
    const currentDate = new Date();

    const result = await User.aggregate([
      // 1. Samo verifikovani korisnici
      {
        $match: {
          isVerified: true,
          deletedAt: null,
        },
      },
      // 2. Poveži sa availabilities
      {
        $lookup: {
          from: "availabilities",
          localField: "_id",
          foreignField: "user",
          as: "availabilities",
        },
      },
      // 3. Razbij array
      {
        $unwind: {
          path: "$availabilities",
          preserveNullAndEmptyArrays: false, // Uklanjamo korisnike bez termina
        },
      },
      // 4. Filtriraj samo prošle termine
      {
        $match: {
          "availabilities.status": 0,
        },
      },
      // 5. Poveži sa services (da dobiješ cenu)
      {
        $lookup: {
          from: "services",
          localField: "availabilities.service",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      // 6. Uzmi samo jednu cenu
      {
        $addFields: {
          servicePrice: { $first: "$serviceDetails.price" },
        },
      },
      // 7. Grupisi po korisniku
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          email: { $first: "$email" },
          phoneNumber: { $first: "$phoneNumber" },
          image: { $first: "$image" },
          createdAt: { $first: "$createdAt" },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ["$availabilities.approved", 0] }, 1, 0],
            },
          },
          skippedCount: {
            $sum: {
              $cond: [{ $eq: ["$availabilities.approved", 1] }, 1, 0],
            },
          },

          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$availabilities.approved", 0] },
                "$servicePrice",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 }, // 👈 sortiranje (najnoviji prvi)
      },
      // 8. Formatiraj izlaz
      {
        $project: {
          id: "$_id",
          _id: 0,
          name: 1,
          email: 1,
          phoneNumber: 1,
          image: 1,
          approvedCount: 1,
          skippedCount: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Extract the results from the $facet output
    // const users = result[0].users;
    // const total =
    //   result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

    // // Send the paginated data and total count in the response
    res.status(200).json({
      status: 200,
      users: result,
      // totalCount: total,
      // page: page,
      // limit: limit,
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
      status: 200,
      message: "User deactivated successfully.",
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
    const { email, password, expoToken } = req.body;

    const employer = await Employers.findOne({ email });
    if (!employer) {
      return res
        .status(200)
        .json({ status: 304, message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, employer.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Not match password" });
    }
    if (!employer.isVerified) {
      return res.status(202).json({
        status: 606,
        message:
          "Your account is not verified yet. Verification code will be sent to your email.",
      });
    }

    const employerData = {
      id: employer._id.toHexString(),
      token: expoToken,
      email: employer.email,
    };

    const token = jwt.sign(employerData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });
    res
      .status(200)
      .json({ status: 200, token, userId: employer._id.toHexString() });
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
      return res
        .status(202)
        .json({ status: 202, message: "Email already exists." });
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
