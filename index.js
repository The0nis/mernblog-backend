const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");

const uploadMiddleware = multer({ dest: "uploads/" });


app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(cookieParser());
mongoose.connect(
  "mongodb+srv://monitechdev:k37oES1hvFWYGaMq@cluster0.n6pl1az.mongodb.net/?retryWrites=true&w=majority"
);
app.use('/uploads',express.static(__dirname + '/uploads'))

const salt = bcrypt.genSaltSync(10);
const securitySalt = "00809edjodoihedoieho2y8";
app.get("/test", (req, res) => {
  res.json("TESTING OoK");
});

app.get("/", (req, res) => {
  res.json("Welcome to Monitech API Calls by Michael");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const UserData = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(UserData);
  } catch (error) {
    res.status(400).json(error);
  }
  //   res.json({
  //     requestData: {
  //       username,
  //       password,
  //     },
  //   });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const matchPassword = bcrypt.compareSync(password, userDoc.password);
  if (matchPassword) {
    jwt.sign(
      {
        username,
        id: userDoc._id,
      },
      securitySalt,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      }
    );
  } else {
    res.status(400).json("Username does not exist");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, securitySalt, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post("/logout", (req, res) => {
  const { token } = req.body;
  res.cookie("token", "");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;

  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, securitySalt, {}, async (err, info) => {
    if (err) throw err;
    const { summary, title, content } = req.body;

    const PostDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });

    res.json(PostDoc);
  });
});

app.get("/post", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.listen(4000);
