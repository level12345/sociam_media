require("dotenv").config();

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  // console.log("Raw header:", req.headers.authorization);
  // console.log("Type:", typeof req.headers.authorization);

  if (!token) {
    const error = new Error("No token passed within header");
    error.statusCode = 401;
    throw error;
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  if (!decodedToken) {
    const error = new Error("Decoded Token is jacked up");
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};
