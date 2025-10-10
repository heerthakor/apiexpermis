// backend/models/sales.js
const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema(
  {
    Year2025: { type: Number },
    TaxableSale: { type: Number},
    ExemptSale: { type: Number},
    SalesTax: { type: Number},
    DeliveryTip: { type: Number},
    GrandTotal: { type: Number},
    CashSales: { type: Number},
    WordPay: { type: Number},
    Amex: { type: Number},
    Doordash: { type: Number},
    Grubhub: { type: Number},
    Ubereats: { type: Number},
    GiftCard: { type: Number},
    Total: { type: Number},
    Difference: { type: Number},
    DepositedCash: { type: Number},
    Expense: { type: Number},
    ActualCashPlusMinus: { type: Number},
    Date: { type: Date },
    fileName: { type: String },
    tableIndex: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("sales", salesSchema);
