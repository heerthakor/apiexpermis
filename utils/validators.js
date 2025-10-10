const Joi = require("joi");

// ✅ User Registration/Login Validation
const userValidator = Joi.object({
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    "string.empty": "Phone number is required",
    "string.pattern.base": "Phone number must be 10 digits"
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long"
  })
});

// ✅ COGS Entry Validation
const cogsValidator = Joi.object({
  srNo: Joi.number().required(),
  weekPeriod: Joi.string().required(),
  period: Joi.string().required(),
  week: Joi.string().required(),
  storeNumber: Joi.string().required(),
  storeName: Joi.string().required(),
  arl: Joi.string().required(),
  reportingHead: Joi.string().required(),
  sales2025: Joi.number().required(),
  sales2024: Joi.number().required(),
  customerCount2025: Joi.number().required(),
  customerCount2024: Joi.number().required(),
  foodcostBlueline: Joi.number(),
  pepsico: Joi.number(),
  totalFoodCost: Joi.number(),
  foodCostPercentage: Joi.number(),
  fourWeekFoodCost: Joi.number(),
  wages: Joi.number(),
  wagesPercentage: Joi.number(),
  fourWeekWageCost: Joi.number(),
  foodAndLabourPercentage: Joi.number(),
  fourWeekAverageFoodAndLabour: Joi.number()
});

// ✅ Sales Entry Validation
const salesValidator = Joi.object({
  taxableSale: Joi.number(),
  exemptSale: Joi.number(),
  salesTax: Joi.number(),
  deliveryTip: Joi.number(),
  grandTotal: Joi.number(),
  cashSales: Joi.number(),
  wordPay: Joi.number(),
  amex: Joi.number(),
  doordash: Joi.number(),
  grubhub: Joi.number(),
  ubereats: Joi.number(),
  giftCard: Joi.number(),
  total: Joi.number(),
  difference: Joi.number(),
  depositedCashTDBank: Joi.number(),
  date: Joi.date(),
  expense: Joi.number(),
  actualCashPlusMinus: Joi.number()
});

module.exports = {
  userValidator,
  cogsValidator,
  salesValidator
};
