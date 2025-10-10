// models/store.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    ReportingHead: { type: String, required: false },
    ARL: { type: String, required: false },
    StoreName: { type: String, required: false },
    StoreNumber: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
