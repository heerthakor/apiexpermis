const express = require("express");
const router = express.Router();
const multer = require("multer");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const fs = require("fs");
const Cogs = require("../models/cogs");

// ---------------- Multer setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + ".xlsx"),
});
const upload = multer({ storage });

// ---------------- Schema fields ----------------
const schemaFields = [
  "Sr",
  "WeekPeriod",
  "Period",
  "Week",
  "DateFrom",
  "To",
  "StoreNumber",
  "StoreName",
  "ARL",
  "ReportingHead",
  "Sales2025",
  "Sales2024",
  "CustomerCount2025",
  "CustomerCount2024",
  "FoodcostBlueline",
  "Pepsico",
  "TotalFoodCost",
  "FoodCostpercent",
  "FourWeekFoodCost",
  "Wages",
  "Wagespercent",
  "FourWeekWageCost",
  "FoodAndLaborPercent",
  "FourWeekAverageFoodAndLabor",
];

// ---------------- Helper ----------------
function normalizeKey(key) {
  return key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}


// ---------------- POST /upload ----------------
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (!rawData.length) return res.status(400).json({ msg: "Excel file is empty" });

    const maxSrDoc = await Cogs.findOne().sort({ Sr: -1 }).lean();
    let currentSr = maxSrDoc ? maxSrDoc.Sr : 0;

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of rawData) {
      const record = {};
      schemaFields.forEach((field) => {
        if (field === "Sr") return;

        const excelKey = Object.keys(item).find(k => normalizeKey(k) === normalizeKey(field));
        let value = excelKey ? item[excelKey] : null;

        const fieldType = Cogs.schema.obj[field]?.type;

        if (value === undefined || value === null || value === "") {
          value = fieldType === Number ? null : "";
        } else if (fieldType === Number) {
          let str = String(value).replace(/,/g, "").replace(/%/g, "").trim();
          if (str.startsWith("(") && str.endsWith(")")) str = "-" + str.slice(1, -1);
          let num = parseFloat(str);
          value = isNaN(num) ? null : Math.round(num * 100) / 100;
        } else if (fieldType === String) {
          value = String(value).trim();
        }

        record[field] = value;
      });

      record.fileName = req.file.originalname;

      const existing = await Cogs.findOne({
        StoreNumber: record.StoreNumber,
        WeekPeriod: record.WeekPeriod,
        Period: record.Period,
      });

      if (existing) {
        await Cogs.updateOne({ _id: existing._id }, { $set: record });
        updatedCount++;
      } else {
        currentSr++;
        record.Sr = currentSr;
        await Cogs.create(record);
        insertedCount++;
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      msg: "COGS uploaded successfully",
      inserted: insertedCount,
      updated: updatedCount,
      total: insertedCount + updatedCount,
    });
  } catch (err) {
    console.error("Error in POST /upload:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
});

// ---------------- GET /all ----------------
router.get("/all", async (req, res) => {
  try {
    const cogs = await Cogs.find().sort({ Sr: 1 }).lean();
    res.json({ success: true, data: cogs });
  } catch (err) {
    console.error("Error fetching COGS:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});
router.post("/submit", async (req, res) => {
  try {
    const data = req.body;

    if (!data.StoreNumber || !data.Week) {
      return res.status(400).json({ success: false, msg: "StoreNumber and Week are required" });
    }

    if (data._id) {
      await Cogs.findByIdAndUpdate(data._id, data, { new: true });
      return res.json({ success: true, msg: "COGS updated successfully" });
    }

    const maxSrDoc = await Cogs.findOne().sort({ Sr: -1 }).lean();
    data.Sr = maxSrDoc ? maxSrDoc.Sr + 1 : 1;

    await Cogs.create(data);
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


// ---------------- GET /store/:storeNumber ----------------
router.get("/store/:storeNumber", async (req, res) => {
  try {
    const storeNumber = req.params.storeNumber;
    const store = await Cogs.findOne({ StoreNumber: storeNumber }).lean();

    if (!store) return res.json({ success: false, msg: "Store not found" });

    res.json({
      success: true,
      data: {
        StoreName: store.StoreName,
        ARL: store.ARL,
        ReportingHead: store.ReportingHead,
      },
    });
  } catch (err) {
    console.error("Error fetching store mapping:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// ---------------- GET /export ----------------
router.get("/export", async (req, res) => {
  try {
    const cogsList = await Cogs.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("COGS Data");

    worksheet.columns = [
      { header: "Sr", key: "Sr", width: 6 },
      { header: "WeekPeriod", key: "WeekPeriod", width: 20 },
      { header: "Period", key: "Period", width: 15 },
      { header: "Week", key: "Week", width: 10 },
      { header: "DateFrom", key: "DateFrom", width: 15 },
      { header: "To", key: "To", width: 15 },
      { header: "StoreNumber", key: "StoreNumber", width: 20 },
      { header: "StoreName", key: "StoreName", width: 25 },
      { header: "ARL", key: "ARL", width: 15 },
      { header: "ReportingHead", key: "ReportingHead", width: 20 },
      { header: "Sales2025", key: "Sales2025", width: 15 },
      { header: "Sales2024", key: "Sales2024", width: 15 },
      { header: "CustomerCount2025", key: "CustomerCount2025", width: 20 },
      { header: "CustomerCount2024", key: "CustomerCount2024", width: 20 },
      { header: "FoodcostBlueline", key: "FoodcostBlueline", width: 18 },
      { header: "Pepsico", key: "Pepsico", width: 12 },
      { header: "TotalFoodCost", key: "TotalFoodCost", width: 18 },
      { header: "FoodCostpercent", key: "FoodCostpercent", width: 18 },
      { header: "FourWeekFoodCost", key: "FourWeekFoodCost", width: 20 },
      { header: "Wages", key: "Wages", width: 15 },
      { header: "Wagespercent", key: "Wagespercent", width: 18 },
      { header: "FourWeekWageCost", key: "FourWeekWageCost", width: 20 },
      { header: "FoodAndLaborPercent", key: "FoodAndLaborPercent", width: 22 },
      { header: "FourWeekAverageFoodAndLabor", key: "FourWeekAverageFoodAndLabor", width: 25 },
    ];

    cogsList.forEach(item => worksheet.addRow(item));

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFF0000" } };
    worksheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 22;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=COGS_Report.xlsx");

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("❌ Excel Export Error:", error);
    res.status(500).json({ message: "Error exporting Excel", error });
  }
});

module.exports = router;
