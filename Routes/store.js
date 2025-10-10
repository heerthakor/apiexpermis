// Routes/store.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const Store = require("../models/store");

// ----------------- Multer setup -----------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ----------------- Upload Excel -----------------
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, msg: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Only pick needed columns
    const cleanedData = jsonData.map((row) => ({
      ReportingHead: row["Reporting Head"] || "",
      ARL: row["ARL"] || "",
      StoreName: row["Store Name"] || "",
      StoreNumber: row["Store Number"] ? String(row["Store Number"]) : "",
    }));

    await Store.deleteMany({}); // optional: clear old data
    await Store.insertMany(cleanedData);

    res.json({
      success: true,
      msg: `${cleanedData.length} stores uploaded successfully`,
      data: cleanedData,
    });
  } catch (err) {
    console.error("❌ Store Upload Error:", err);
    res.status(500).json({
      success: false,
      msg: "Error processing store Excel file",
      error: err.message,
    });
  }
});

// ---------------- POST /submit ----------------
router.post("/submit", async (req, res) => {
  try {
    const data = req.body;

    if (!data.StoreNumber || !data.Week) {
      return res.status(400).json({ success: false, msg: "StoreNumber and Week are required" });
    }

    if (data._id) {
      await Store.findByIdAndUpdate(data._id, data, { new: true });
      return res.json({ success: true, msg: "COGS updated successfully" });
    }

    const maxSrDoc = await Store.findOne().sort({ Sr: -1 }).lean();
    data.Sr = maxSrDoc ? maxSrDoc.Sr + 1 : 1;

    await Store.create(data);
    res.json({ success: true, msg: "COGS entry saved successfully" });
  } catch (error) {
    console.error("❌ Error in POST /submit:", error);
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

// ----------------- Fetch all stores -----------------
router.get("/all", async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.json({ success: true, data: stores });
  } catch (err) {
    console.error("❌ Fetch Store Error:", err);
    res.status(500).json({ success: false, msg: "Error fetching store data" });
  }
});

// ----------------- Fetch by Store Number -----------------
router.get("/:storeNumber", async (req, res) => {
  try {
    const { storeNumber } = req.params;
    const store = await Store.findOne({ StoreNumber: storeNumber });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({
      success: true,
      data: {
        ReportingHead: store.ReportingHead,
        ARL: store.ARL,
        StoreName: store.StoreName,
        StoreNumber: store.StoreNumber,
      },
    });
  } catch (err) {
    console.error("❌ Fetch by Store Number Error:", err);
    res.status(500).json({ success: false, msg: "Error fetching store" });
  }
});

module.exports = router;
