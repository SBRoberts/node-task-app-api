const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");
const { sendWelcomeEmail, sendCancelEmail } = require("../emails/account");

const router = new express.Router();

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/.(jpeg|jpg|png)$/)) {
      return cb(new Error("Please upload a jpeg, jpg or png"));
    }
    cb(undefined, true);
  }
});

// Create New User
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Log User In
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (err) {
    res.status(400).send();
  }
});

// Logout User
router.post("/users/logout", authMiddleware, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      ({ token }) => token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

// Upload user profile picture
router.post(
  "/users/me/avatar",
  authMiddleware,
  upload.single("upload"),
  async (req, res) => {
    // req.user.avatar = req.file.buffer;
    const buffer = await sharp(req.file.buffer)
      .png()
      .resize(400, 400)
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Delete avatar
router.delete("/users/me/avatar", authMiddleware, async (req, res) => {
  // console.log(req.file.buffer);
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send();
  }
});

// Logout User From All
router.post("/users/logoutAll", authMiddleware, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

// Get Authenticated User
router.get("/users/me", authMiddleware, async (req, res) => {
  res.send(req.user);
});

// Update User By ID
router.patch("/users/me", authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send("Error: Invalid Updates 👾");
  }

  try {
    const user = req.user;

    updates.forEach(update => (user[update] = req.body[update]));

    await req.user.save();

    return !user ? res.status(404).send() : res.send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Delete User
router.delete("/users/me", authMiddleware, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
