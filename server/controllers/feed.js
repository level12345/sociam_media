const fs = require("fs");
const path = require("path");
const express = require("express");
const { validationResult } = require("express-validator");

// const io = require("../socket");
const Post = require("../models/posts");
const User = require("../models/user");

// exports.getPosts = (req, res, next) => {
//   const currentPage = req.query.page || 1;
//   const perPage = 2;
//   const userId = req.userId;
//   let totalItems;

//   // console.log(`Logging from getPosts: ${req.userId}`);

//   console.log("Before Retrieving all posts");

//   const filter = { creator: userId };

//   Post.find()
//     .countDocuments()
//     .then((count) => {
//       totalItems = count;
//       return Post.find()
//         .populate("creator", "name -_id")
//         .skip((currentPage - 1) * perPage)
//         .limit(perPage);
//     })
//     .then((posts) => {
//       let updatedPost = posts.map((p) => ({
//         ...p.toObject(),
//         creator: p.creator.name,
//       }));
//       res.status(200).json({
//         messsage: "Fetched all posts successfully",
//         posts: updatedPost,
//         totalItems: totalItems,
//       });

//       console.log("Just After sending res.json response");

//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });

//   console.log("After retrieving all posts");
// };

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  const userId = req.userId;
  // let totalItems;

  // console.log("Before Retrieving all posts");
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator", "name -_id")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    let updatedPost = posts.map((p) => ({
      ...p.toObject(),
      creator: p.creator.name,
    }));
    res.status(200).json({
      messsage: "Fetched all posts successfully",
      posts: updatedPost,
      totalItems: totalItems,
    });
    // console.log("Just After sending res.json response");
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  // console.log("After retrieving all posts");
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("No Image Provided");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path;
  const userId = req.userId;
  // console.log(`Logging from createPosts: ${req.userId}`);

  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    creator: userId,
  });

  // let savedPost;
  try {
    let savedPost = await post.save();
    let loggedInUser = await User.findById(userId);
    loggedInUser.posts.push(savedPost._id);
    await loggedInUser.save();

    // io.getIO().emit("posts", {
    //   action: "create",
    //   post: savedPost,
    // });

    res.status(201).json({
      message: "Post created successfully!",
      post: savedPost,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // post
  //   .save()
  //   .then((postContent) => {
  //     savedPost = postContent;
  //     return User.findById(userId);
  //   })
  //   .then((loggedInUser) => {
  //     loggedInUser.posts.push(savedPost._id);
  //     return loggedInUser.save();
  //   })
  //   .then(() =>
  //     res.status(201).json({
  //       message: "Post created successfully!",
  //       post: savedPost,
  //     })
  //   )
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.singlePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    let specificPost = await Post.findById(postId);
    if (!specificPost) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      post: specificPost,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // Post.findById(postId)
  //   .then((specificPost) => {
  //     if (!specificPost) {
  //       const error = new Error("Post not found");
  //       error.statusCode = 404;
  //       throw error;
  //     }

  //     res.status(200).json({
  //       post: specificPost,
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const postId = req.params.postId;
  const userId = req.userId;

  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error("No image added");
    error.statusCode = 422;
    throw error;
  }

  try {
    let postToUpdate = await Post.findById(postId).populate("creator");
    if (!postToUpdate) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    console.log(userId);
    // console.log(postToUpdate);
    console.log(postToUpdate.creator._id.toString());

    // console.log(postToUpdate.creator);
    // console.log(postToUpdate.creator.toString());

    if (postToUpdate.creator._id.toString() !== userId) {
      const error = new Error("Token Error");
      error.statusCode = 403;
      throw error;
    }
    postToUpdate.title = title;
    postToUpdate.content = content;
    postToUpdate.imageUrl = imageUrl;
    let updatedPost = await postToUpdate.save();
    console.log(updatedPost);

    // io.getIO().emit("posts", { action: "update", post: updatedPost });

    res.status(200).json({
      message: "Post successfully updated",
      post: updatedPost,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // Post.findById(postId)
  //   .then((postToUpdate) => {
  //     if (!postToUpdate) {
  //       const error = new Error("Post not found");
  //       error.statusCode = 404;
  //       throw error;
  //     }

  //     if (postToUpdate.creator.toString() !== userId) {
  //       const error = new Error("Token Error");
  //       error.statusCode = 403;
  //       throw error;
  //     }

  //     // if (imageUrl !== postToUpdate.imageUrl) {
  //     //   const error = new Error("Image Url mismatch");
  //     //   error.statusCode = 422;
  //     //   throw error;
  //     // }

  //     postToUpdate.title = title;
  //     postToUpdate.content = content;
  //     postToUpdate.imageUrl = imageUrl;
  //     return postToUpdate.save();
  //   })
  //   .then((updatedPost) => {
  //     // console.log(updatedPost);
  //     if (!updatedPost) {
  //       const error = new Error("Post not found");
  //       error.statusCode = 404;
  //       throw error;
  //     }

  //     res.status(200).json({
  //       message: "Post successfully updated",
  //       post: updatedPost,
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.userId;

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: {
        posts: postId,
      },
    });

    let postToDelete = await Post.findById(postId);
    if (!postToDelete) {
      const error = new Error("Post to Delete not found");
      error.statusCode = 404;
      throw error;
    }

    if (postToDelete.creator.toString() !== userId) {
      const error = new Error("Token Error");
      error.statusCode = 403;
      throw error;
    }
    await Post.findByIdAndDelete(postId);

    // io.getIO().emit("posts", { action: "delete", post: postId });

    res.status(200).json({
      message: "Post Delete Successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // User.findByIdAndUpdate(userId, {
  //   $pull: {
  //     posts: postId,
  //   },
  // })
  //   .then((user) => {
  //     return Post.findById(postId);
  //   })
  //   .then((postToDelete) => {
  //     if (!postToDelete) {
  //       const error = new Error("Post to Delete not found");
  //       error.statusCode = 404;
  //       throw error;
  //     }

  //     if (postToDelete.creator.toString() !== userId) {
  //       const error = new Error("Token Error");
  //       error.statusCode = 403;
  //       throw error;
  //     }

  //     return Post.findByIdAndDelete(postId);
  //   })
  //   .then((result) => {
  //     res.status(200).json({
  //       message: "Post Delete Successfully",
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.statusUpdate = async (req, res, next) => {
  const userId = req.userId;
  const status = req.body.status;

  try {
    let user = await User.findByIdAndUpdate(userId, { status: status });
    res.status(200).json({
      message: "Status updated Successfully",
      status1: user.status,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // User.findByIdAndUpdate(userId, { status: status })
  //   .then((user) => {
  //     res.status(200).json({
  //       message: "Status updated Successfully",
  //       status1: user.status,
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.getUpdate = async (req, res, next) => {
  const userId = req.userId;

  try {
    let user = User.findById(userId);
    res.status(200).json({
      message: "Status Retrieved Successfully",
      status: user.status,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  // User.findById(userId)
  //   .then((user) => {
  //     res.status(200).json({
  //       message: "Status Retrieved Successfully",
  //       status: user.status,
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};
