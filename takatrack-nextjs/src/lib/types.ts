export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  user_id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string | null;
  payment_method: string;
  transaction_date: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  month: string;
  limit_amount: number;
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  created_at: string;
};

export const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Education", "Health", "Housing", "Entertainment", "Other"
];
export const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Business", "Tuition", "Gift", "Other"
];
export const PAYMENT_METHODS = ["Cash", "Card", "Bank", "Mobile banking", "Other"];
