const jwt = require("jsonwebtoken");
const Token = require("../models/Token");
require("dotenv").config();
// Middleware to protect routes (auth middleware)
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");

  if (!token)
    return res.status(403).json({ status: 403, message: "Access denied" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const isValid = await Token.find({ token: decoded.token });

    if (!isValid || isValid.length === 0) {
      return res
        .status(401)
        .json({ status: 401, message: "Unauthorized: Token invalidated" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: 401, message: "Unauthorized: Token invalidated" });
  }
};
module.exports = {
  authenticate,
};
