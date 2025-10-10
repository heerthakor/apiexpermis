// ----------------- Imports -----------------
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");

// Models
const User = require("./models/user");
const StoreReport = require("./models/cogs");
const Sales = require("./models/sales");

// Config
const connectDB = require("./config/db");
dotenv.config();

// ----------------- App Initialization -----------------
const app = express();

// ----------------- Middleware -----------------
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ----------------- Connect to MongoDB -----------------
connectDB();

// ----------------- JWT Middleware -----------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

// ----------------- Ensure uploads folder exists -----------------
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ----------------- Multer setup for Excel -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ----------------- Routes -----------------
const authRoutes = require("./Routes/auth");
const cogsRoutes = require("./Routes/cogs");
const storeRoutes = require("./Routes/store");


// Public Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/cogs",cogsRoutes);
app.use("/api/store",storeRoutes);

// ----------------- COGS Routes -----------------

// Export COGS data to Excel
app.get("/api/cogs/export", async (req, res) => {
  try {
    const cogsList = await StoreReport.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("COGS Data");

    worksheet.columns = [
      { header: "Sr", key: "sr", width: 6 },
      { header: "WeekPeriod", key: "WeekPeriod", width: 20 },
      { header: "Period", key: "Period", width: 15 },
      { header: "Week", key: "Week", width: 10 },
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

    cogsList.forEach((item, index) => {
      worksheet.addRow({ sr: index + 1, ...item._doc });
    });

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

// Upload COGS Excel
app.post("/api/cogs/upload-excel", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, msg: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    await StoreReport.insertMany(jsonData);
    return res.json({ success: true, data: jsonData });
  } catch (err) {
    console.error("❌ COGS Excel Upload Error:", err);
    return res.status(500).json({ success: false, msg: "Error processing COGS Excel file" });
  }
});

// Fetch all COGS data
app.get("/api/cogs/all", verifyToken, async (req, res) => {
  try {
    const cogsData = await StoreReport.find().sort({ createdAt: -1 });
    res.json({ success: true, data: cogsData });
  } catch (err) {
    console.error("❌ Fetch COGS Error:", err);
    res.status(500).json({ success: false, msg: "Error fetching COGS data" });
  }
});

// ----------------- Sales Routes -----------------
app.post("/api/sales", verifyToken, upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, msg: "No files uploaded" });
    }

    console.log("📦 Received sales upload:", req.files.length, "files");

    const excelDateToJSDate = (serial) => {
      if (!serial || isNaN(serial)) return null;
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
    };

    const safeNumber = (value) => (isNaN(Number(value)) ? 0 : Number(value));

    let totalRecords = 0;
    let insertedRecords = 0;

    for (const file of req.files) {
      const workbook = xlsx.readFile(file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: true });

      totalRecords += jsonData.length;

      const formattedData = jsonData
        .map((row) => {
          // Parse Date safely
          let parsedDate = null;
          if (row["Date"] !== undefined && row["Date"] !== null && row["Date"] !== "") {
            if (typeof row["Date"] === "number") {
              parsedDate = excelDateToJSDate(row["Date"]);
            } else {
              const tempDate = new Date(row["Date"]);
              parsedDate = isNaN(tempDate.getTime()) ? null : tempDate;
            }
          }

          return {
            Year2025: safeNumber(row["Year2025"]),
            TaxableSale: safeNumber(row["TaxableSale"]),
            ExemptSale: safeNumber(row["ExemptSale"]),
            SalesTax: safeNumber(row["SalesTax"]),
            DeliveryTip: safeNumber(row["DeliveryTip"]),
            GrandTotal: safeNumber(row["GrandTotal"]),
            CashSales: safeNumber(row["CashSales"]),
            WordPay: safeNumber(row["WordPay"]),
            Amex: safeNumber(row["Amex"]),
            Doordash: safeNumber(row["Doordash"]),
            Grubhub: safeNumber(row["Grubhub"]),
            Ubereats: safeNumber(row["Ubereats"]),
            GiftCard: safeNumber(row["GiftCard"]),
            Total: safeNumber(row["Total"]),
            Difference: safeNumber(row["Difference"]),
            DepositedCash: safeNumber(row["DepositedCash"]),
            Expense: safeNumber(row["Expense"]),
            ActualCashPlusMinus: safeNumber(row["ActualCashPlusMinus"]),
            Date: parsedDate,
            fileName: file.originalname,
            tableIndex: 1,
          };
        })
        // Remove rows with invalid dates
        .filter((row) => row.Date !== null);

      insertedRecords += formattedData.length;

      if (formattedData.length > 0) {
        await Sales.insertMany(formattedData);
      }
    }

    res.json({
      success: true,
      msg: `✅ ${insertedRecords} valid sales records inserted from ${req.files.length} file(s) (total rows: ${totalRecords})`,
    });
  } catch (err) {
    console.error("❌ Sales Upload Error:", err);
    res.status(500).json({ success: false, msg: "Error processing Sales Excel file(s)" });
  }
});


// Fetch all Sales data
app.get("/api/sales/all", verifyToken, async (req, res) => {
  try {
    const salesData = await Sales.find().sort({ createdAt: -1 });
    res.json({ success: true, data: salesData });
  } catch (err) {
    console.error("❌ Fetch Sales Error:", err);
    res.status(500).json({ success: false, msg: "Error fetching sales data" });
  }
});

// ----------------- Health Check -----------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ----------------- Handle Unknown Routes -----------------
app.use((req, res) => {
  res.status(404).json({ success: false, msg: `Route not found: ${req.originalUrl}` });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3003;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
