const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],

  feedController.createPost
);

router.get("/post/:postId", isAuth, feedController.singlePost);

router.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],

  feedController.updatePost
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

router.get("/status", isAuth, feedController.getUpdate);

router.put("/status", isAuth, feedController.statusUpdate);

module.exports = router;

// const method = "PUT";
// const URL = `http://localhost:3001/feed/posts/status`;

// fetch(method, URL, {
//   headers: {
//     Authorization: "Bearer " + this.props.token,
//   },
// });
