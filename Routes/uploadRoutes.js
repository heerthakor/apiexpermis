const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const StoreReport = require("../models/cogs");
const Sales = require("../models/sales");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Store Report Excel
router.post("/upload-excel", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    const data = rawData.map(item => ({
      Sr: item["Sr"],
      WeekPeriod: item["week Period"],
      Period: item["Period"],
      Week: item["Week"],
      Storenumber: item["Store Number"],
      Storename: item["Store Name"],
      ARL: item["ARL"],
      Reportinghead: item["Reporting Head"],
      Sales2025: item["Sales2025"],
      Sales2024: item["Sales2024"],
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

    res.json({ success: true, message: "Store Report uploaded successfully", count: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error uploading store report" });
  }
});

// Upload Sales Excel
router.post("/upload-sales", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
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

    res.json({ success: true, message: "Sales Excel uploaded successfully", count: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error uploading sales data" });
  }
});

module.exports = router;
