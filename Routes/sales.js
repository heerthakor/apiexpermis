// backend/routes/sales.js
const express = require("express");
const router = express.Router();
const SalesReport = require("../models/sales");
const ExcelJS = require("exceljs");

// -------------------- CREATE -------------------- //
// POST /api/sales/add
router.post("/add", async (req, res) => {
  try {
    const newReport = new SalesReport(req.body);
    const savedReport = await newReport.save();
    res.status(201).json({
      success: true,
      message: "✅ Sales report added successfully",
      data: savedReport,
    });
  } catch (err) {
    console.error("❌ Error adding Sales report:", err);
    res.status(500).json({
      success: false,
      message: "Server error while adding sales report",
      error: err.message,
    });
  }
});

// -------------------- READ ALL -------------------- //
// GET /api/sales/all
router.get("/all", async (req, res) => {
  try {
    const salesData = await SalesReport.find().sort({ createdAt: -1 });
    if (!salesData || salesData.length === 0) {
      return res.json({ success: true, data: [], message: "No sales found" });
    }
    res.json({ success: true, data: salesData });
  } catch (err) {
    console.error("❌ Fetch Sales Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------- READ ONE -------------------- //
// GET /api/sales/:id
router.get("/:id", async (req, res) => {
  try {
    const report = await SalesReport.findById(req.params.id);
    if (!report)
      return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, data: report });
  } catch (err) {
    console.error("❌ Error fetching Sales report by ID:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// -------------------- UPDATE -------------------- //
// PUT /api/sales/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await SalesReport.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ success: false, message: "Report not found" });

    res.json({ success: true, message: "✅ Sales report updated", data: updated });
  } catch (err) {
    console.error("❌ Error updating Sales report:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// -------------------- DELETE -------------------- //
// DELETE /api/sales/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SalesReport.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Report not found" });

    res.json({ success: true, message: "🗑️ Sales report deleted" });
  } catch (err) {
    console.error("❌ Error deleting Sales report:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// -------------------- EXPORT TO EXCEL -------------------- //
// GET /api/sales/export
router.get("/export", async (req, res) => {
  try {
    const data = await SalesReport.find().sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales");

    worksheet.columns = [
      { header: "Date", key: "Date", width: 12 },
      { header: "Year", key: "year2025", width: 12 },
      { header: "TaxableSale", key: "TaxableSale", width: 12 },
      { header: "ExemptSale", key: "ExemptSale", width: 12 },
      { header: "SalesTax", key: "SalesTax", width: 12 },
      { header: "DeliveryTip", key: "DeliveryTip", width: 12 },
      { header: "GrandTotal", key: "GrandTotal", width: 12 },
      { header: "CashSales", key: "CashSales", width: 12 },
      { header: "WordPay", key: "WordPay", width: 12 },
      { header: "Amex", key: "Amex", width: 12 },
      { header: "Doordash", key: "Doordash", width: 12 },
      { header: "Grubhub", key: "Grubhub", width: 12 },
      { header: "Ubereats", key: "Ubereats", width: 12 },
      { header: "GiftCard", key: "GiftCard", width: 12 },
      { header: "Total", key: "Total", width: 12 },
      { header: "Difference", key: "Difference", width: 12 },
      { header: "DepositedCash", key: "DepositedCash", width: 18 },
      { header: "Expense", key: "Expense", width: 12 },
      { header: "ActualCashPlusMinus", key: "ActualCashPlusMinus", width: 18 },
    ];

    data.forEach((row) => {
      worksheet.addRow({
        Date: row.Date ? new Date(row.Date).toLocaleDateString() : "",
        year2025: row.year2025 ?? "",
        TaxableSale: row.TaxableSale ?? "",
        ExemptSale: row.ExemptSale ?? "",
        SalesTax: row.SalesTax ?? "",
        DeliveryTip: row.DeliveryTip ?? "",
        GrandTotal: row.GrandTotal ?? "",
        CashSales: row.CashSales ?? "",
        WordPay: row.WordPay ?? "",
        Amex: row.Amex ?? "",
        Doordash: row.Doordash ?? "",
        Grubhub: row.Grubhub ?? "",
        Ubereats: row.Ubereats ?? "",
        GiftCard: row.GiftCard ?? "",
        Total: row.Total ?? "",
        Difference: row.Difference ?? "",
        DepositedCash: row.DepositedCash ?? "",
        Expense: row.Expense ?? "",
        ActualCashPlusMinus: row.ActualCashPlusMinus ?? "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=sales.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Error exporting Sales data:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
