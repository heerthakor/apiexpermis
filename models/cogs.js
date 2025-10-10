const mongoose = require("mongoose");

const CogsSchema = new mongoose.Schema(
  {
    Sr: { type: Number, default: 0 },
    WeekPeriod: { type: String, default: "" },
    Period: { type: String, default: "" },
    Week: { type: String, default: "" },
    DateFrom: { type: String, default: "" }, 
    To: { type: String, default: "" },       
    StoreNumber: { type: String, default: "" },
    StoreName: { type: String, default: "" },
    ARL: { type: String, default: "" },
    ReportingHead: { type: String, default: "" },
    Sales2025: { type: Number, default: 0 },
    Sales2024: { type: Number, default: 0 },
    CustomerCount2025: { type: Number, default: 0 },
    CustomerCount2024: { type: Number, default: 0 },
    FoodcostBlueline: { type: Number, default: 0 },
    Pepsico: { type: Number, default: 0 },
    TotalFoodCost: { type: Number, default: 0 },
    FoodCostpercent: { type: Number, default: 0 },
    FourWeekFoodCost: { type: Number, default: 0 },
    Wages: { type: Number, default: 0 },
    Wagespercent: { type: Number, default: 0 },
    FourWeekWageCost: { type: Number, default: 0 },
    FoodAndLaborPercent: { type: Number, default: 0 },
    FourWeekAverageFoodAndLabor: { type: Number, default: 0 },
    fileName: { type: String, default: "" }, // Optional if not uploading Excel
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cogs", CogsSchema);
