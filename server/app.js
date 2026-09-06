require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const { query, validationResult } = require("express-validator");
const mongoose = require("mongoose");
// const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

// const MONGODB_URI =
//   "mongodb+srv://brianA:REDACTED@cluster0.gpjw2ct.mongodb.net/meses123?retryWrites=true&w=majority&appName=Cluster0";

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"),
);
app.use("/images", express.static(path.join(__dirname, "images")));
// app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // 👈 stops here for preflights
  }

  next();
});

// Test Code
app.get("/hello", query("person").notEmpty(), (req, res) => {
  const result = validationResult(req);
  console.log(result);

  const htmlContent = "<html><body><h1>Hello, World!</h1></body></html>";

  if (result.isEmpty()) {
    return res.send(`Hello, ${req.query.person}! , ${htmlContent}`);
  }

  res.send({ errors: result.array() });
});
/////
app.use("/auth", authRoutes);
app.use("/feed", feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data,
  });
});

// mongoose
//   // .connect(MONGODB_URI)
//   .connect(process.env.MONGODB_URI)
//   .then((result) => {
//     const server = app.listen(process.env.PORT);
//     const io = require("./socket").init(server, {
//       cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],
//         credentials: true,
//       },
//     });
//     io.on("connection", (socket) => {
//       console.log("Client Connected");
//     });
//   })
//   .catch((err) => {
//     console.log(err);
//   });

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    const PORT = process.env.PORT || 3001;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
