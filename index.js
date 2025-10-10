const mongoose = require("mongoose");
const express = require("express");
const app = express();
const multer = require("multer");
const xlsx = require("xlsx");

const Sales = require("../models/sales");    

app.use(express.json());

mongoose.connect(
  "mongodb+srv://heerthakor64:heer0721@cluster0.xw6b9nw.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0",
  { useUnifiedTopology: true }
)
  .then(() => console.log("Database Connected"))
  .catch(err => console.error("DB Error:", err));


const storage = multer.memoryStorage();
const upload = multer({ storage });


app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.json({ msg: "All fields are required" });
    }

    const regData = await userReg.findOne({ email });
    if (regData) {
      return res.json({ msg: "You have already registered, please login" });
    }

    const user = new userReg({ name, email, password });
    await user.save();
    res.json({ msg: "Successfully Registered" });
  } catch (err) {
    res.status(500).json({ status: err.message });
  }
});

// ---------------- Upload Store Report Excel ----------------
app.post("/upload-excel", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    const data = rawData.map(item => ({
      Sr: item["Sr"],
      weekPeriod: item["week Period"],
      Period: item["Period"],
      Week: item["Week"],
      Storenumber: item["Store #"],
      Storename: item["Store Name"],
      ARL: item["ARL"],
      Reportinghead: item["Reporting Head"],
      Sales2025: item["2025 Sales"],
      Sales2024: item["2024 Sales"],
      Customercount2025: item["Customer Count 2025"],
      Customercount2024: item["Customer Count 2024"],
      FoodcostBlueline: item["Foodcost Blueline"],
      Pepsico: item["Pepsico"],
      TotalFoodCost: item["Total Food Cost"],
      FoodCostpercentage: item["Food Cost %"],
      FourWeekFoodCost: item["4 Week Food Cost"],
      Wages: item["Wages"],
      Wagespercentage: item["Wages %"],
      FourWeekWageCost: item["4 Week Wage Cost"],
      FoodAndLaborpercentage: item["Food & Labor %"],
      FourWeekAverageFoodAndLabour: item["4 Week Average Food & Labour"]
    }));

    await StoreReport.insertMany(data);

    res.json({
      success: true,
      message: "Store Report uploaded successfully",
      count: data.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error uploading store report" });
  }
});

app.post("/upload-sales", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    const data = rawData.map(item => ({
      TaxableSale: item["Taxable Sale"],
      ExemptSale: item["Exempt Sale"],
      SalesTax: item["Sales Tax"],
      DeliveryTip: item["Delivery Tip"],
      GrandTotal: item["Grand Total"],

      CashSales: item["Cash Sales"],
      WordPay: item["Word Pay"],
      Amex: item["Amex"],
      Doordash: item["Doordash"],
      Grubhub: item["Grubhub"],
      Ubereats: item["Uber eats"],
      GiftCard: item["Gift Card"],
      Total: item["Total"] || item["Grand Total"],
      Difference: item["Difference"],
      DepositedCashTDBank: item["Deposited Cash TD Bank"],
      Date: item["Date"] ? new Date(item["Date"]) : null,
      Expense: item["Expense"],
      Actualashplusminus: item["Actual Cash +/-"]
    }));

    await Sales.insertMany(data);

    res.json({
      success: true,
      message: "Sales Excel uploaded successfully",
      count: data.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error uploading sales data" });
  }
});


app.get("/getUsers", async (req, res) => {
  try {
    let data = await userReg.find();
    res.status(200).send({ status: data });
  } catch (error) {
    res.status(500).send(error);
  }
});


app.listen(3003, () => {
  console.log("Server running on port 3003");
});
