export interface ParsedTransaction {
  date: Date;
  amount: number;
  description: string;
  rawMerchant: string;
}

interface ColumnMapping {
  date: number;
  amount: number;
  description: number;
  credit?: number;
}

function detectColumns(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase().trim());

  const dateCol = lower.findIndex(
    (h) => h.includes("date") || h === "posted" || h === "post date"
  );
  const descCol = lower.findIndex(
    (h) =>
      h.includes("description") ||
      h.includes("merchant") ||
      h.includes("memo") ||
      h.includes("payee") ||
      h.includes("name")
  );
  const amountCol = lower.findIndex(
    (h) =>
      h === "amount" ||
      h.includes("debit") ||
      h === "charge" ||
      h === "transaction amount"
  );
  const creditCol = lower.findIndex(
    (h) => h === "credit" || h === "payment" || h === "credits"
  );

  return {
    date: dateCol >= 0 ? dateCol : 0,
    description: descCol >= 0 ? descCol : 1,
    amount: amountCol >= 0 ? amountCol : lower.length - 1,
    credit: creditCol >= 0 ? creditCol : undefined,
  };
}

function parseDate(str: string): Date {
  const cleaned = str.replace(/"/g, "").trim();
  // Try MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
  const mdyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdyMatch) {
    const year =
      mdyMatch[3].length === 2 ? 2000 + parseInt(mdyMatch[3]) : parseInt(mdyMatch[3]);
    return new Date(year, parseInt(mdyMatch[1]) - 1, parseInt(mdyMatch[2]));
  }
  return new Date(cleaned);
}

function parseAmount(str: string): number {
  const cleaned = str.replace(/"/g, "").replace(/[$,\s]/g, "").trim();
  if (!cleaned || cleaned === "") return 0;
  // Handle parentheses as negative: (123.45) → -123.45
  const parenMatch = cleaned.match(/^\((.+)\)$/);
  if (parenMatch) return -parseFloat(parenMatch[1]);
  return parseFloat(cleaned);
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const mapping = detectColumns(headers);
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 2) continue;

    const dateStr = fields[mapping.date];
    const description = fields[mapping.description]?.replace(/"/g, "") || "";
    let amount = parseAmount(fields[mapping.amount] || "0");

    // If there's a separate credit column, combine
    if (mapping.credit !== undefined && fields[mapping.credit]) {
      const credit = parseAmount(fields[mapping.credit]);
      if (credit !== 0 && amount === 0) {
        amount = credit;
      }
    }

    const date = parseDate(dateStr);
    if (isNaN(date.getTime()) || isNaN(amount)) continue;

    transactions.push({
      date,
      amount,
      description,
      rawMerchant: description,
    });
  }

  return transactions;
}
