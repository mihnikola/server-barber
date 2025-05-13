const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.getRoles = async (req, res) => {
  const token = req.header("Authorization") ? req.header("Authorization") : req.body.headers.Authorization ? req.body.headers.Authorization : req.get('authorization'); 
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // Find the user with the decoded id
    const user = await User.findOne({ _id: decoded.id });

    res.status(200).json({user});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
