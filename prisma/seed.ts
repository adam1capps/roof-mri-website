import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      globalRiskProfile: "SEMI_AGGRESSIVE",
    },
  });

  // ── Chart of Accounts (IRS Schedule C aligned) ──────────────────────

  const categories = [
    // Income
    { id: "income", name: "Income", type: "income", parentId: null, sortOrder: 1 },
    { id: "income-gross", name: "Gross Receipts / Sales", type: "income", parentId: "income", sortOrder: 1 },
    { id: "income-other", name: "Other Income", type: "income", parentId: "income", sortOrder: 2 },
    { id: "income-interest", name: "Interest Income", type: "income", parentId: "income", sortOrder: 3 },
    { id: "income-refunds", name: "Returns & Refunds", type: "income", parentId: "income", sortOrder: 4 },

    // Cost of Goods Sold
    { id: "cogs", name: "Cost of Goods Sold", type: "expense", parentId: null, sortOrder: 2 },
    { id: "cogs-materials", name: "Materials & Supplies", type: "expense", parentId: "cogs", sortOrder: 1 },
    { id: "cogs-labor", name: "Direct Labor", type: "expense", parentId: "cogs", sortOrder: 2 },

    // Expenses
    { id: "expenses", name: "Expenses", type: "expense", parentId: null, sortOrder: 3 },
    { id: "exp-advertising", name: "Advertising", type: "expense", parentId: "expenses", sortOrder: 1 },
    { id: "exp-auto", name: "Car & Truck Expenses", type: "expense", parentId: "expenses", sortOrder: 2 },
    { id: "exp-commissions", name: "Commissions & Fees", type: "expense", parentId: "expenses", sortOrder: 3 },
    { id: "exp-contract", name: "Contract Labor", type: "expense", parentId: "expenses", sortOrder: 4 },
    { id: "exp-depreciation", name: "Depreciation", type: "expense", parentId: "expenses", sortOrder: 5 },
    { id: "exp-insurance", name: "Insurance", type: "expense", parentId: "expenses", sortOrder: 6 },
    { id: "exp-interest", name: "Interest (Mortgage)", type: "expense", parentId: "expenses", sortOrder: 7 },
    { id: "exp-interest-other", name: "Interest (Other)", type: "expense", parentId: "expenses", sortOrder: 8 },
    { id: "exp-legal", name: "Legal & Professional Services", type: "expense", parentId: "expenses", sortOrder: 9 },
    { id: "exp-office", name: "Office Expense", type: "expense", parentId: "expenses", sortOrder: 10 },
    { id: "exp-pension", name: "Pension & Profit-Sharing", type: "expense", parentId: "expenses", sortOrder: 11 },
    { id: "exp-rent-equipment", name: "Rent (Equipment)", type: "expense", parentId: "expenses", sortOrder: 12 },
    { id: "exp-rent-property", name: "Rent (Property)", type: "expense", parentId: "expenses", sortOrder: 13 },
    { id: "exp-repairs", name: "Repairs & Maintenance", type: "expense", parentId: "expenses", sortOrder: 14 },
    { id: "exp-supplies", name: "Supplies", type: "expense", parentId: "expenses", sortOrder: 15 },
    { id: "exp-taxes", name: "Taxes & Licenses", type: "expense", parentId: "expenses", sortOrder: 16 },
    { id: "exp-travel", name: "Travel", type: "expense", parentId: "expenses", sortOrder: 17 },
    { id: "exp-meals", name: "Meals (Business)", type: "expense", parentId: "expenses", sortOrder: 18 },
    { id: "exp-utilities", name: "Utilities", type: "expense", parentId: "expenses", sortOrder: 19 },
    { id: "exp-wages", name: "Wages", type: "expense", parentId: "expenses", sortOrder: 20 },
    { id: "exp-home-office", name: "Home Office", type: "expense", parentId: "expenses", sortOrder: 21 },
    { id: "exp-phone", name: "Phone & Internet", type: "expense", parentId: "expenses", sortOrder: 22 },
    { id: "exp-software", name: "Software & Subscriptions", type: "expense", parentId: "expenses", sortOrder: 23 },
    { id: "exp-education", name: "Education & Training", type: "expense", parentId: "expenses", sortOrder: 24 },
    { id: "exp-bank-fees", name: "Bank Fees & Charges", type: "expense", parentId: "expenses", sortOrder: 25 },
    { id: "exp-other", name: "Other Expenses", type: "expense", parentId: "expenses", sortOrder: 99 },

    // Assets
    { id: "assets", name: "Assets", type: "asset", parentId: null, sortOrder: 4 },
    { id: "asset-cash", name: "Cash & Bank Accounts", type: "asset", parentId: "assets", sortOrder: 1 },
    { id: "asset-ar", name: "Accounts Receivable", type: "asset", parentId: "assets", sortOrder: 2 },
    { id: "asset-equipment", name: "Equipment", type: "asset", parentId: "assets", sortOrder: 3 },
    { id: "asset-vehicle", name: "Vehicles", type: "asset", parentId: "assets", sortOrder: 4 },

    // Liabilities
    { id: "liabilities", name: "Liabilities", type: "liability", parentId: null, sortOrder: 5 },
    { id: "liab-ap", name: "Accounts Payable", type: "liability", parentId: "liabilities", sortOrder: 1 },
    { id: "liab-credit-cards", name: "Credit Card Balances", type: "liability", parentId: "liabilities", sortOrder: 2 },
    { id: "liab-loans", name: "Loans Payable", type: "liability", parentId: "liabilities", sortOrder: 3 },
    { id: "liab-taxes", name: "Taxes Payable", type: "liability", parentId: "liabilities", sortOrder: 4 },

    // Equity
    { id: "equity", name: "Equity", type: "equity", parentId: null, sortOrder: 6 },
    { id: "equity-owner", name: "Owner's Equity", type: "equity", parentId: "equity", sortOrder: 1 },
    { id: "equity-draws", name: "Owner's Draws", type: "equity", parentId: "equity", sortOrder: 2 },
    { id: "equity-retained", name: "Retained Earnings", type: "equity", parentId: "equity", sortOrder: 3 },

    // Personal / Non-Business
    { id: "personal", name: "Personal (Non-Business)", type: "expense", parentId: null, sortOrder: 99 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  // ── Accounting Rules (Three Tiers) ──────────────────────────────────

  const rules = [
    // HARD rules — black and white, no judgment needed
    {
      name: "Payroll Taxes",
      description: "Payroll taxes (FICA, FUTA, state) are always a deductible business expense.",
      categoryId: "exp-taxes",
      tier: "HARD",
    },
    {
      name: "Loan Principal Payments",
      description: "Principal payments on business loans reduce the liability, not an expense.",
      categoryId: "liab-loans",
      tier: "HARD",
    },
    {
      name: "Business Insurance Premiums",
      description: "Business insurance premiums are fully deductible as a business expense.",
      categoryId: "exp-insurance",
      tier: "HARD",
    },
    {
      name: "Office Rent",
      description: "Rent for dedicated business office space is fully deductible.",
      categoryId: "exp-rent-property",
      tier: "HARD",
    },
    {
      name: "Business License Fees",
      description: "State and local business license fees are fully deductible.",
      categoryId: "exp-taxes",
      tier: "HARD",
    },
    {
      name: "Professional Services",
      description: "CPA, attorney, and consultant fees for business purposes are fully deductible.",
      categoryId: "exp-legal",
      tier: "HARD",
    },

    // SEMI-AGGRESSIVE rules — defensible but require some judgment
    {
      name: "Home Office (Simplified)",
      description: "Simplified home office deduction: $5/sq ft, max 300 sq ft ($1,500/year). Lower risk than actual method.",
      categoryId: "exp-home-office",
      tier: "SEMI_AGGRESSIVE",
      metadata: JSON.stringify({ method: "simplified", ratePerSqFt: 5, maxSqFt: 300 }),
    },
    {
      name: "Vehicle Mileage (Standard Rate)",
      description: "Standard mileage rate for business use of personal vehicle. Must track mileage log.",
      categoryId: "exp-auto",
      tier: "SEMI_AGGRESSIVE",
      metadata: JSON.stringify({ rate2025: 0.70, requiresLog: true }),
    },
    {
      name: "Business Meals (50%)",
      description: "Meals with clients/prospects during business discussions are 50% deductible.",
      categoryId: "exp-meals",
      tier: "SEMI_AGGRESSIVE",
      metadata: JSON.stringify({ deductionPercent: 50 }),
    },
    {
      name: "Phone & Internet (% Business Use)",
      description: "Personal phone/internet partially deductible based on estimated business use percentage.",
      categoryId: "exp-phone",
      tier: "SEMI_AGGRESSIVE",
      metadata: JSON.stringify({ defaultBusinessPercent: 50 }),
    },
    {
      name: "Software Subscriptions",
      description: "Software and SaaS tools used for business are deductible. Mixed-use tools prorated.",
      categoryId: "exp-software",
      tier: "SEMI_AGGRESSIVE",
    },
    {
      name: "Continuing Education",
      description: "Courses, books, and training that maintain or improve business skills are deductible.",
      categoryId: "exp-education",
      tier: "SEMI_AGGRESSIVE",
    },

    // AGGRESSIVE rules — maximum deductions, gray area
    {
      name: "Home Office (Actual Method)",
      description: "Actual expenses method: deduct real costs (mortgage interest, utilities, repairs) based on sq ft %. Higher deduction but higher audit risk.",
      categoryId: "exp-home-office",
      tier: "AGGRESSIVE",
      metadata: JSON.stringify({ method: "actual" }),
    },
    {
      name: "Augusta Rule (Section 280A)",
      description: "Rent your personal home to your business for up to 14 days/year tax-free. Requires fair market rate documentation.",
      categoryId: "exp-rent-property",
      tier: "AGGRESSIVE",
      metadata: JSON.stringify({ maxDays: 14, requiresFMVDocumentation: true }),
    },
    {
      name: "Hiring Children",
      description: "Pay children under 18 for legitimate business work. Wages shift income to lower bracket, exempt from FICA if sole prop.",
      categoryId: "exp-wages",
      tier: "AGGRESSIVE",
      metadata: JSON.stringify({ maxAge: 18, requiresReasonableWage: true }),
    },
    {
      name: "Section 179 Vehicle Depreciation",
      description: "Immediately expense heavy vehicles (>6,000 lbs GVWR) used >50% for business. Full deduction in year of purchase.",
      categoryId: "exp-depreciation",
      tier: "AGGRESSIVE",
      metadata: JSON.stringify({ minGVWR: 6000, minBusinessUsePercent: 50 }),
    },
    {
      name: "Business Travel with Personal Component",
      description: "Deduct full travel costs when primary purpose is business, even if some personal days included.",
      categoryId: "exp-travel",
      tier: "AGGRESSIVE",
    },
    {
      name: "Entertainment as Business Development",
      description: "Reclassify entertainment expenses as business development/marketing. Post-2017 TCJA this is aggressive.",
      categoryId: "exp-advertising",
      tier: "AGGRESSIVE",
    },
  ];

  for (const rule of rules) {
    await prisma.accountingRule.upsert({
      where: { id: rule.name.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {},
      create: {
        id: rule.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        ...rule,
        metadata: "metadata" in rule ? (rule as { metadata: string }).metadata : null,
      },
    });
  }

  console.log("Seed complete: categories and accounting rules created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
