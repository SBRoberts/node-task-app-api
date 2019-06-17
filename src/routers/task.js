const express = require("express");
const Task = require("../models/task");
const authMiddleware = require("../middleware/auth");

const router = new express.Router();

// Create New Task
router.post("/tasks", authMiddleware, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Read All Tasks
router.get("/tasks", authMiddleware, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const [key, value] = req.query.sortBy.split(":");
    sort[key] = value === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Read Task By ID
router.get("/tasks/:id", authMiddleware, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    return !task ? res.status(404).send() : res.send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Update Task By ID
router.patch("/tasks/:id", authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["completed", "description"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send("Error: Not a valid update 🐲");
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => (task[update] = req.body[update]));

    await task.save();

    res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

// Delete Task By ID
router.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    return !task ? res.status(404).send() : res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
