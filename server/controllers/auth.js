const User = require("../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed on signUp route");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  // console.log("reached route");

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  // console.log(`${email}, ${name}, ${password}`);

  try {
    let hashedPw = await bcrypt.hash(password, 12);

    const user = new User({
      email: email,
      password: hashedPw,
      name: name,
    });

    let result = await user.save();
    res.status(201).json({
      message: "Successfully added user",
      userId: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // bcrypt
  //   .hash(password, 12)
  //   .then((hashedPw) => {
  //     const user = new User({
  //       email: email,
  //       password: hashedPw,
  //       name: name,
  //     });
  //     return user.save();
  //   })
  //   .then((result) => {
  //     res.status(201).json({
  //       message: "Successfully added user",
  //       userId: result._id,
  //     });
  //   })

  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  try {
    let user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    let pwIsEqual = await bcrypt.compare(password, loadedUser.password);
    if (!pwIsEqual) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      // "secret",
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      token: token,
      userId: loadedUser._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // User.findOne({ email: email })
  //   .then((user) => {
  //     if (!user) {
  //       const error = new Error("User not found");
  //       error.statusCode = 401;
  //       throw error;
  //     }

  //     loadedUser = user;
  //     return bcrypt.compare(password, loadedUser.password);
  //   })
  //   .then((pwIsEqual) => {
  //     if (!pwIsEqual) {
  //       const error = new Error("Wrong password");
  //       error.statusCode = 401;
  //       throw error;
  //     }

  //     const token = jwt.sign(
  //       {
  //         email: loadedUser.email,
  //         userId: loadedUser._id.toString(),
  //       },
  //       "secret",
  //       { expiresIn: "1h" }
  //     );

  //     // console.log("Serialized JSON:", JSON.stringify(token));

  //     res.status(200).json({
  //       token: token,
  //       userId: loadedUser._id.toString(),
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};
