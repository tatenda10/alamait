-- Missing Transactions Export
-- Generated: 2025-11-19T13:23:59.614Z
-- Total transactions: 40
-- Date range: 2025-10-01 to 2025-10-31 23:59:59

SET FOREIGN_KEY_CHECKS = 0;

-- Transaction: INV-1759935341535-iiix7uwuk (initial_invoice)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'initial_invoice',
  '2025-09-30 22:00:00',
  'INV-1759935341535-iiix7uwuk',
  'Initial invoice - Student',
  210.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 14:55:41'
);

-- Transaction: INV-1759938426147-ck4dyvzg5 (initial_invoice)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'initial_invoice',
  '2025-09-30 22:00:00',
  'INV-1759938426147-ck4dyvzg5',
  'Initial invoice - testing50 testing50',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:47:06'
);

-- Transaction: INV-1760005288104-jpp216gef (initial_invoice)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'initial_invoice',
  '2025-09-30 22:00:00',
  'INV-1760005288104-jpp216gef',
  'Initial invoice - test90 Masango',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 10:21:28'
);

-- Transaction: INV-1760009548501-h60abiiaq (initial_invoice)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'initial_invoice',
  '2025-09-30 22:00:00',
  'INV-1760009548501-h60abiiaq',
  'Initial invoice - Rutendo test test',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 11:32:28'
);

-- Transaction: ADMIN-1759911368408-0falwx92o (admin_fee)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'admin_fee',
  '2025-10-07 22:00:00',
  'ADMIN-1759911368408-0falwx92o',
  'Admin fee for student enrollment - 44',
  20.00,
  'USD',
  'posted',
  6,
  1,
  '2025-10-08 08:16:08'
);

-- Transaction: PMT-1759912873894 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759912873894',
  'monthly rent payment - Cash to Rentals Income',
  130.00,
  'USD',
  'posted',
  6,
  1,
  '2025-10-08 08:41:13'
);

-- Transaction: PMT-1759913387254 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759913387254',
  'monthly rent payment - Petty Cash to Rentals Income',
  130.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 08:49:47'
);

-- Transaction: ADMIN-1759914704935-i7k3yrfx7 (admin_fee)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'admin_fee',
  '2025-10-07 22:00:00',
  'ADMIN-1759914704935-i7k3yrfx7',
  'Admin fee for student enrollment - 45',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 09:11:44'
);

-- Transaction: ADMIN-1759915001251-4y9d5semt (admin_fee)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'admin_fee',
  '2025-10-07 22:00:00',
  'ADMIN-1759915001251-4y9d5semt',
  'Admin fee for student enrollment - 46',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 09:16:41'
);

-- Transaction: ADMIN-1759915609515-tv8l6fazt (admin_fee)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'admin_fee',
  '2025-10-07 22:00:00',
  'ADMIN-1759915609515-tv8l6fazt',
  'Admin fee for student enrollment - 47',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 09:26:49'
);

-- Transaction: ADMIN-1759935341517-g6zsmtggo (admin_fee)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'admin_fee',
  '2025-10-07 22:00:00',
  'ADMIN-1759935341517-g6zsmtggo',
  'Admin fee for student enrollment - 52',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 14:55:41'
);

-- Transaction: PMT-1759938512387 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759938512387',
  'monthly rent payment - Petty Cash to Rentals Income',
  120.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:48:32'
);

-- Transaction: PMT-1759938845376 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759938845376',
  'monthly rent payment - Cash to Rentals Income',
  19.99,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:54:05'
);

-- Transaction: PMT-1759939145512 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759939145512',
  'monthly rent payment - Cash to Rentals Income',
  10.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:59:05'
);

-- Transaction: PMT-1759939408736 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759939408736',
  'monthly rent payment - Cash to Accounts Receivable',
  40.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 16:03:28'
);

-- Transaction: PMT-1759939764690 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-07 22:00:00',
  'PMT-1759939764690',
  'monthly rent payment - Cash to Accounts Receivable',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 16:09:24'
);

-- Transaction: PMT-1760005468259 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-08 22:00:00',
  'PMT-1760005468259',
  'monthly rent payment - Petty Cash to Accounts Receivable',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 10:24:28'
);

-- Transaction: PMT-1760009738804 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-08 22:00:00',
  'PMT-1760009738804',
  'monthly rent payment - Petty Cash to Accounts Receivable',
  120.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 11:35:38'
);

-- Transaction: BP-5 (branch_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'branch_payment',
  '2025-10-11 22:00:00',
  'BP-5',
  'Branch Payment - Student 17',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-12 14:24:24'
);

-- Transaction: BP-9 (branch_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'branch_payment',
  '2025-10-11 22:00:00',
  'BP-9',
  'Branch Payment - Student 38',
  200.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 14:56:53'
);

-- Transaction: BP-10 (branch_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'branch_payment',
  '2025-10-11 22:00:00',
  'BP-10',
  'Branch Payment - Student 38',
  100.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 15:17:58'
);

-- Transaction: BP-11 (branch_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'branch_payment',
  '2025-10-11 22:00:00',
  'BP-11',
  'Branch Payment - Student 38',
  100.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 15:22:50'
);

-- Transaction: BP-12 (branch_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'branch_payment',
  '2025-10-11 22:00:00',
  'BP-12',
  'Branch Payment - Student 38',
  300.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 15:27:14'
);

-- Transaction: EXP-REQ-1 (expense)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'expense',
  '2025-10-11 22:00:00',
  'EXP-REQ-1',
  'Expenditure Request: water request',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-12 17:02:38'
);

-- Transaction: test (petty_cash_addition)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_addition',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Addition: cash replenish for budget',
  300.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 07:55:05'
);

-- Transaction: test (petty_cash_addition)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_addition',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Addition: test',
  300.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 07:57:54'
);

-- Transaction: test (petty_cash_addition)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_addition',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Addition: test',
  300.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:02:38'
);

-- Transaction: test (petty_cash_addition)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_addition',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Addition: test',
  100.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:21:28'
);

-- Transaction: test (petty_cash_addition)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_addition',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Addition: test',
  200.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:24:34'
);

-- Transaction: test (petty_cash_withdrawal)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_withdrawal',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Withdrawal: submit',
  500.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:35:40'
);

-- Transaction: test (petty_cash_addition)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'petty_cash_addition',
  '2025-10-13 22:00:00',
  'test',
  'Petty Cash Addition: test',
  200.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:54:16'
);

-- Transaction: 208 (accounts_payable_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'accounts_payable_payment',
  '2025-10-13 22:00:00',
  NULL,
  'Payment for test',
  100.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-14 13:20:38'
);

-- Transaction: 209 (accounts_payable_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'accounts_payable_payment',
  '2025-10-13 22:00:00',
  NULL,
  'Payment for test',
  100.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-14 13:21:26'
);

-- Transaction: 204 (accounts_payable)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'accounts_payable',
  '2025-10-14 10:00:57',
  NULL,
  'test',
  NULL,
  'USD',
  'posted',
  4,
  1,
  '2025-10-14 10:00:57'
);

-- Transaction: ADMIN-1760950092152-gc3r9wo09 (admin_fee)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'admin_fee',
  '2025-10-19 22:00:00',
  'ADMIN-1760950092152-gc3r9wo09',
  'Admin fee for student enrollment - 60',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-20 08:48:12'
);

-- Transaction: EXP-REQ-8 (expense)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'expense',
  '2025-10-21 22:00:00',
  'EXP-REQ-8',
  'Expenditure Request: test99',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-21 23:05:11'
);

-- Transaction: PC-13-1761121578728 (beginning_balance)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'beginning_balance',
  '2025-10-21 22:00:00',
  'PC-13-1761121578728',
  'Initial balance for Marko Belvedere',
  20.00,
  'USD',
  'posted',
  5,
  1,
  '2025-10-22 08:26:18'
);

-- Transaction: PC-15-1761124339959 (beginning_balance)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'beginning_balance',
  '2025-10-21 22:00:00',
  'PC-15-1761124339959',
  'Initial balance for test st kilda',
  30.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-22 09:12:19'
);

-- Transaction: PMT-1761125504497 (monthly_rent)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'monthly_rent',
  '2025-10-21 22:00:00',
  'PMT-1761125504497',
  'monthly rent payment - Petty Cash to Accounts Receivable',
  60.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-22 09:31:44'
);

-- Transaction: BP-13 (branch_payment)
INSERT INTO transactions (
  transaction_type,
  transaction_date,
  reference,
  description,
  amount,
  currency,
  status,
  boarding_house_id,
  created_by,
  created_at
) VALUES (
  'branch_payment',
  '2025-10-21 22:00:00',
  'BP-13',
  'Branch Payment - Student 17',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-22 09:35:13'
);

SET FOREIGN_KEY_CHECKS = 1;

-- Export completed: 40 transactions
