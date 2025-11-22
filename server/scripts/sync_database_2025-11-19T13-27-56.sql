-- Database Sync Script: Online → Localhost
-- Generated: 2025-11-19T13:27:56.273Z
-- Date Range: 2025-10-01 to 2025-10-31 23:59:59
-- Transactions: 40
-- Journal Entries: 77

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- Delete existing journal entries
DELETE FROM journal_entries WHERE id IN (913,914,915,916,911,912,917,918,919,920,921,922,923,924,925,926,927,928,929,930,1131,1132,935,936,937,938,941,942,945,946,947,948,949,950,951,952,953,954,955,956,959,960,961,962,963,964,965,966,969,970,971,972,973,974,975,976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991,992,993,994,997,998,999,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1137,1138,1139,1140,1157,1158,1161,1162,1163,1164,1165,1166,1167,1168,1169,1170,1173,1174,1175,1176,1177,1178,1179,1180,1181,1182,1183,1184,1185,1186,1187,1188,1189,1190,1191,1192,1193,1194,1195,1196,1211,1212,1213,1214,1207,1208,1209,1210,1217,1218,1219,1220,1221,1222,1223,1224);

-- Delete existing transactions
DELETE FROM transactions WHERE id IN (459,460,461,462,463,464,465,466,467,468,469,471,472,474,476,477,478,479,480,481,483,484,485,486,488,489,490,491,492,493,494,495,496,497,498,499,500,502,503,504,505,506,507,508,509,510,571,572,581,582,583,584,585,586,588,589,590,591,592,593,594,595,596,597,598,599,600,601,605,606,607,608,609,610);

-- Insert transactions from localhost
INSERT INTO transactions (
  id,
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
  168,
  'initial_invoice',
  '2025-09-30',
  'INV-1759935341535-iiix7uwuk',
  'Initial invoice - Student',
  210.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 14:55:41'
);

INSERT INTO transactions (
  id,
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
  170,
  'initial_invoice',
  '2025-09-30',
  'INV-1759938426147-ck4dyvzg5',
  'Initial invoice - testing50 testing50',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:47:06'
);

INSERT INTO transactions (
  id,
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
  176,
  'initial_invoice',
  '2025-09-30',
  'INV-1760005288104-jpp216gef',
  'Initial invoice - test90 Masango',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 10:21:28'
);

INSERT INTO transactions (
  id,
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
  178,
  'initial_invoice',
  '2025-09-30',
  'INV-1760009548501-h60abiiaq',
  'Initial invoice - Rutendo test test',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 11:32:28'
);

INSERT INTO transactions (
  id,
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
  160,
  'admin_fee',
  '2025-10-07',
  'ADMIN-1759911368408-0falwx92o',
  'Admin fee for student enrollment - 44',
  20.00,
  'USD',
  'posted',
  6,
  1,
  '2025-10-08 08:16:08'
);

INSERT INTO transactions (
  id,
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
  162,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759912873894',
  'monthly rent payment - Cash to Rentals Income',
  130.00,
  'USD',
  'posted',
  6,
  1,
  '2025-10-08 08:41:13'
);

INSERT INTO transactions (
  id,
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
  163,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759913387254',
  'monthly rent payment - Petty Cash to Rentals Income',
  130.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 08:49:47'
);

INSERT INTO transactions (
  id,
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
  164,
  'admin_fee',
  '2025-10-07',
  'ADMIN-1759914704935-i7k3yrfx7',
  'Admin fee for student enrollment - 45',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 09:11:44'
);

INSERT INTO transactions (
  id,
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
  165,
  'admin_fee',
  '2025-10-07',
  'ADMIN-1759915001251-4y9d5semt',
  'Admin fee for student enrollment - 46',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 09:16:41'
);

INSERT INTO transactions (
  id,
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
  166,
  'admin_fee',
  '2025-10-07',
  'ADMIN-1759915609515-tv8l6fazt',
  'Admin fee for student enrollment - 47',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 09:26:49'
);

INSERT INTO transactions (
  id,
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
  167,
  'admin_fee',
  '2025-10-07',
  'ADMIN-1759935341517-g6zsmtggo',
  'Admin fee for student enrollment - 52',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 14:55:41'
);

INSERT INTO transactions (
  id,
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
  171,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759938512387',
  'monthly rent payment - Petty Cash to Rentals Income',
  120.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:48:32'
);

INSERT INTO transactions (
  id,
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
  172,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759938845376',
  'monthly rent payment - Cash to Rentals Income',
  19.99,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:54:05'
);

INSERT INTO transactions (
  id,
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
  173,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759939145512',
  'monthly rent payment - Cash to Rentals Income',
  10.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 15:59:05'
);

INSERT INTO transactions (
  id,
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
  174,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759939408736',
  'monthly rent payment - Cash to Accounts Receivable',
  40.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 16:03:28'
);

INSERT INTO transactions (
  id,
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
  175,
  'monthly_rent',
  '2025-10-07',
  'PMT-1759939764690',
  'monthly rent payment - Cash to Accounts Receivable',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-08 16:09:24'
);

INSERT INTO transactions (
  id,
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
  177,
  'monthly_rent',
  '2025-10-08',
  'PMT-1760005468259',
  'monthly rent payment - Petty Cash to Accounts Receivable',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 10:24:28'
);

INSERT INTO transactions (
  id,
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
  179,
  'monthly_rent',
  '2025-10-08',
  'PMT-1760009738804',
  'monthly rent payment - Petty Cash to Accounts Receivable',
  120.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-09 11:35:38'
);

INSERT INTO transactions (
  id,
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
  184,
  'branch_payment',
  '2025-10-11',
  'BP-5',
  'Branch Payment - Student 17',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-12 14:24:24'
);

INSERT INTO transactions (
  id,
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
  188,
  'branch_payment',
  '2025-10-11',
  'BP-9',
  'Branch Payment - Student 38',
  200.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 14:56:53'
);

INSERT INTO transactions (
  id,
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
  189,
  'branch_payment',
  '2025-10-11',
  'BP-10',
  'Branch Payment - Student 38',
  100.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 15:17:58'
);

INSERT INTO transactions (
  id,
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
  190,
  'branch_payment',
  '2025-10-11',
  'BP-11',
  'Branch Payment - Student 38',
  100.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 15:22:50'
);

INSERT INTO transactions (
  id,
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
  191,
  'branch_payment',
  '2025-10-11',
  'BP-12',
  'Branch Payment - Student 38',
  300.00,
  'USD',
  'posted',
  5,
  2,
  '2025-10-12 15:27:14'
);

INSERT INTO transactions (
  id,
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
  192,
  'expense',
  '2025-10-11',
  'EXP-REQ-1',
  'Expenditure Request: water request',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-12 17:02:38'
);

INSERT INTO transactions (
  id,
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
  194,
  'petty_cash_addition',
  '2025-10-13',
  'test',
  'Petty Cash Addition: cash replenish for budget',
  300.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 07:55:05'
);

INSERT INTO transactions (
  id,
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
  195,
  'petty_cash_addition',
  '2025-10-13',
  'test',
  'Petty Cash Addition: test',
  300.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 07:57:54'
);

INSERT INTO transactions (
  id,
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
  196,
  'petty_cash_addition',
  '2025-10-13',
  'test',
  'Petty Cash Addition: test',
  300.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:02:38'
);

INSERT INTO transactions (
  id,
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
  199,
  'petty_cash_addition',
  '2025-10-13',
  'test',
  'Petty Cash Addition: test',
  100.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:21:28'
);

INSERT INTO transactions (
  id,
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
  200,
  'petty_cash_addition',
  '2025-10-13',
  'test',
  'Petty Cash Addition: test',
  200.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:24:34'
);

INSERT INTO transactions (
  id,
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
  201,
  'petty_cash_withdrawal',
  '2025-10-13',
  'test',
  'Petty Cash Withdrawal: submit',
  500.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:35:40'
);

INSERT INTO transactions (
  id,
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
  202,
  'petty_cash_addition',
  '2025-10-13',
  'test',
  'Petty Cash Addition: test',
  200.00,
  'USD',
  'posted',
  1,
  1,
  '2025-10-14 08:54:16'
);

INSERT INTO transactions (
  id,
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
  208,
  'accounts_payable_payment',
  '2025-10-13',
  NULL,
  'Payment for test',
  100.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-14 13:20:38'
);

INSERT INTO transactions (
  id,
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
  209,
  'accounts_payable_payment',
  '2025-10-13',
  NULL,
  'Payment for test',
  100.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-14 13:21:26'
);

INSERT INTO transactions (
  id,
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
  204,
  'accounts_payable',
  '2025-10-14',
  NULL,
  'test',
  NULL,
  'USD',
  'posted',
  4,
  1,
  '2025-10-14 10:00:57'
);

INSERT INTO transactions (
  id,
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
  211,
  'admin_fee',
  '2025-10-19',
  'ADMIN-1760950092152-gc3r9wo09',
  'Admin fee for student enrollment - 60',
  20.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-20 08:48:12'
);

INSERT INTO transactions (
  id,
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
  215,
  'expense',
  '2025-10-21',
  'EXP-REQ-8',
  'Expenditure Request: test99',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-21 23:05:11'
);

INSERT INTO transactions (
  id,
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
  216,
  'beginning_balance',
  '2025-10-21',
  'PC-13-1761121578728',
  'Initial balance for Marko Belvedere',
  20.00,
  'USD',
  'posted',
  5,
  1,
  '2025-10-22 08:26:18'
);

INSERT INTO transactions (
  id,
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
  217,
  'beginning_balance',
  '2025-10-21',
  'PC-15-1761124339959',
  'Initial balance for test st kilda',
  30.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-22 09:12:19'
);

INSERT INTO transactions (
  id,
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
  222,
  'monthly_rent',
  '2025-10-21',
  'PMT-1761125504497',
  'monthly rent payment - Petty Cash to Accounts Receivable',
  60.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-22 09:31:44'
);

INSERT INTO transactions (
  id,
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
  223,
  'branch_payment',
  '2025-10-21',
  'BP-13',
  'Branch Payment - Student 17',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-22 09:35:13'
);

-- Insert journal entries from localhost
INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  319,
  160,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 44',
  6,
  1,
  '2025-10-08 08:16:08',
  '2025-10-08 08:16:08'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  320,
  160,
  53,
  'credit',
  20.00,
  'Admin fee income - Student 44',
  6,
  1,
  '2025-10-08 08:16:08',
  '2025-10-08 08:16:08'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  323,
  162,
  48,
  'debit',
  130.00,
  'monthly rent payment - Debit Cash',
  6,
  1,
  '2025-10-08 08:41:13',
  '2025-10-08 08:41:13'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  324,
  162,
  53,
  'credit',
  130.00,
  'monthly rent payment - Credit Rentals Income',
  6,
  1,
  '2025-10-08 08:41:13',
  '2025-10-08 08:41:13'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  325,
  163,
  47,
  'debit',
  130.00,
  'monthly rent payment - Debit Petty Cash',
  4,
  1,
  '2025-10-08 08:49:47',
  '2025-10-08 08:49:47'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  326,
  163,
  53,
  'credit',
  130.00,
  'monthly rent payment - Credit Rentals Income',
  4,
  1,
  '2025-10-08 08:49:47',
  '2025-10-08 08:49:47'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  327,
  164,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 45',
  4,
  1,
  '2025-10-08 09:11:44',
  '2025-10-08 09:11:44'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  328,
  164,
  53,
  'credit',
  20.00,
  'Admin fee income - Student 45',
  4,
  1,
  '2025-10-08 09:11:44',
  '2025-10-08 09:11:44'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  329,
  165,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 46',
  4,
  1,
  '2025-10-08 09:16:41',
  '2025-10-08 09:16:41'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  330,
  165,
  53,
  'credit',
  20.00,
  'Admin fee income - Student 46',
  4,
  1,
  '2025-10-08 09:16:41',
  '2025-10-08 09:16:41'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  331,
  166,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 47',
  4,
  1,
  '2025-10-08 09:26:49',
  '2025-10-08 09:26:49'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  332,
  166,
  53,
  'credit',
  20.00,
  'Admin fee income - Student 47',
  4,
  1,
  '2025-10-08 09:26:49',
  '2025-10-08 09:26:49'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  333,
  167,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 52',
  4,
  1,
  '2025-10-08 14:55:41',
  '2025-10-08 14:55:41'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  334,
  167,
  53,
  'credit',
  20.00,
  'Admin fee income - Student 52',
  4,
  1,
  '2025-10-08 14:55:41',
  '2025-10-08 14:55:41'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  335,
  168,
  51,
  'debit',
  210.00,
  'Initial invoice - Debit Accounts Receivable',
  4,
  1,
  '2025-10-08 14:55:41',
  '2025-10-08 14:55:41'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  336,
  168,
  53,
  'credit',
  210.00,
  'Initial invoice - Credit Rentals Income',
  4,
  1,
  '2025-10-08 14:55:41',
  '2025-10-08 14:55:41'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  339,
  170,
  51,
  'debit',
  180.00,
  'Initial invoice - Debit Accounts Receivable',
  4,
  1,
  '2025-10-08 15:47:06',
  '2025-10-08 15:47:06'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  340,
  170,
  53,
  'credit',
  180.00,
  'Initial invoice - Credit Rentals Income',
  4,
  1,
  '2025-10-08 15:47:06',
  '2025-10-08 15:47:06'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  341,
  171,
  47,
  'debit',
  120.00,
  'monthly rent payment - Debit Petty Cash',
  4,
  1,
  '2025-10-08 15:48:32',
  '2025-10-08 15:48:32'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  342,
  171,
  53,
  'credit',
  120.00,
  'monthly rent payment - Credit Rentals Income',
  4,
  1,
  '2025-10-08 15:48:32',
  '2025-10-08 15:48:32'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  343,
  172,
  48,
  'debit',
  19.99,
  'monthly rent payment - Debit Cash',
  4,
  1,
  '2025-10-08 15:54:05',
  '2025-10-08 15:54:05'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  344,
  172,
  53,
  'credit',
  19.99,
  'monthly rent payment - Credit Rentals Income',
  4,
  1,
  '2025-10-08 15:54:05',
  '2025-10-08 15:54:05'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  345,
  173,
  48,
  'debit',
  10.00,
  'monthly rent payment - Debit Cash',
  4,
  1,
  '2025-10-08 15:59:05',
  '2025-10-08 15:59:05'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  346,
  173,
  53,
  'credit',
  10.00,
  'monthly rent payment - Credit Rentals Income',
  4,
  1,
  '2025-10-08 15:59:05',
  '2025-10-08 15:59:05'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  347,
  174,
  48,
  'debit',
  40.00,
  'monthly rent payment - Debit Cash',
  4,
  1,
  '2025-10-08 16:03:28',
  '2025-10-08 16:03:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  348,
  174,
  51,
  'credit',
  40.00,
  'monthly rent payment - Credit Accounts Receivable',
  4,
  1,
  '2025-10-08 16:03:28',
  '2025-10-08 16:03:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  349,
  175,
  48,
  'debit',
  20.00,
  'monthly rent payment - Debit Cash',
  4,
  1,
  '2025-10-08 16:09:24',
  '2025-10-08 16:09:24'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  350,
  175,
  51,
  'credit',
  20.00,
  'monthly rent payment - Credit Accounts Receivable',
  4,
  1,
  '2025-10-08 16:09:24',
  '2025-10-08 16:09:24'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  351,
  176,
  51,
  'debit',
  180.00,
  'Initial invoice - Debit Accounts Receivable',
  4,
  1,
  '2025-10-09 10:21:28',
  '2025-10-09 10:21:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  352,
  176,
  53,
  'credit',
  180.00,
  'Initial invoice - Credit Rentals Income',
  4,
  1,
  '2025-10-09 10:21:28',
  '2025-10-09 10:21:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  353,
  177,
  47,
  'debit',
  160.00,
  'monthly rent payment - Debit Petty Cash',
  4,
  1,
  '2025-10-09 10:24:28',
  '2025-10-09 10:24:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  354,
  177,
  51,
  'credit',
  160.00,
  'monthly rent payment - Credit Accounts Receivable',
  4,
  1,
  '2025-10-09 10:24:28',
  '2025-10-09 10:24:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  355,
  178,
  51,
  'debit',
  180.00,
  'Initial invoice - Debit Accounts Receivable',
  4,
  1,
  '2025-10-09 11:32:28',
  '2025-10-09 11:32:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  356,
  178,
  53,
  'credit',
  180.00,
  'Initial invoice - Credit Rentals Income',
  4,
  1,
  '2025-10-09 11:32:28',
  '2025-10-09 11:32:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  357,
  179,
  47,
  'debit',
  120.00,
  'monthly rent payment - Debit Petty Cash',
  4,
  1,
  '2025-10-09 11:35:38',
  '2025-10-09 11:35:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  358,
  179,
  51,
  'credit',
  120.00,
  'monthly rent payment - Credit Accounts Receivable',
  4,
  1,
  '2025-10-09 11:35:38',
  '2025-10-09 11:35:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  365,
  184,
  47,
  'debit',
  200.00,
  'Petty Cash - Branch Payment 5',
  4,
  2,
  '2025-10-12 14:24:24',
  '2025-10-12 14:24:24'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  366,
  184,
  51,
  'credit',
  200.00,
  'Accounts Receivable - Branch Payment 5',
  4,
  2,
  '2025-10-12 14:24:24',
  '2025-10-12 14:24:24'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  373,
  188,
  47,
  'debit',
  200.00,
  'Petty Cash - Branch Payment 9',
  5,
  2,
  '2025-10-12 14:56:53',
  '2025-10-12 14:56:53'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  374,
  188,
  51,
  'credit',
  200.00,
  'Accounts Receivable - Branch Payment 9',
  5,
  2,
  '2025-10-12 14:56:53',
  '2025-10-12 14:56:53'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  375,
  189,
  47,
  'debit',
  100.00,
  'Petty Cash - Branch Payment 10',
  5,
  2,
  '2025-10-12 15:17:58',
  '2025-10-12 15:17:58'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  376,
  189,
  51,
  'credit',
  100.00,
  'Accounts Receivable - Branch Payment 10',
  5,
  2,
  '2025-10-12 15:17:58',
  '2025-10-12 15:17:58'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  377,
  190,
  47,
  'debit',
  100.00,
  'Petty Cash - Branch Payment 11',
  5,
  2,
  '2025-10-12 15:22:50',
  '2025-10-12 15:22:50'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  378,
  190,
  51,
  'credit',
  100.00,
  'Accounts Receivable - Branch Payment 11',
  5,
  2,
  '2025-10-12 15:22:50',
  '2025-10-12 15:22:50'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  379,
  191,
  47,
  'debit',
  300.00,
  'Petty Cash - Branch Payment 12',
  5,
  2,
  '2025-10-12 15:27:14',
  '2025-10-12 15:27:14'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  380,
  191,
  51,
  'credit',
  300.00,
  'Accounts Receivable - Branch Payment 12',
  5,
  2,
  '2025-10-12 15:27:14',
  '2025-10-12 15:27:14'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  381,
  192,
  56,
  'debit',
  200.00,
  'Expenditure Request: water request',
  4,
  2,
  '2025-10-12 17:02:38',
  '2025-10-12 17:02:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  382,
  192,
  47,
  'credit',
  200.00,
  'Payment for: water request',
  4,
  2,
  '2025-10-12 17:02:38',
  '2025-10-12 17:02:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  383,
  194,
  47,
  'debit',
  300.00,
  'Petty Cash Addition: cash replenish for budget',
  1,
  1,
  '2025-10-14 07:55:05',
  '2025-10-14 07:55:05'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  384,
  194,
  48,
  'credit',
  300.00,
  'Petty Cash Addition from Cash',
  1,
  1,
  '2025-10-14 07:55:05',
  '2025-10-14 07:55:05'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  385,
  195,
  47,
  'debit',
  300.00,
  'Petty Cash Addition: test',
  1,
  1,
  '2025-10-14 07:57:54',
  '2025-10-14 07:57:54'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  386,
  195,
  48,
  'credit',
  300.00,
  'Petty Cash Addition from Cash',
  1,
  1,
  '2025-10-14 07:57:54',
  '2025-10-14 07:57:54'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  387,
  196,
  47,
  'debit',
  300.00,
  'Petty Cash Addition: test',
  1,
  1,
  '2025-10-14 08:02:38',
  '2025-10-14 08:02:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  388,
  196,
  48,
  'credit',
  300.00,
  'Petty Cash Addition from Cash',
  1,
  1,
  '2025-10-14 08:02:38',
  '2025-10-14 08:02:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  389,
  199,
  47,
  'debit',
  100.00,
  'Petty Cash Addition: test',
  1,
  1,
  '2025-10-14 08:21:28',
  '2025-10-14 08:21:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  390,
  199,
  48,
  'credit',
  100.00,
  'Petty Cash Addition from Cash',
  1,
  1,
  '2025-10-14 08:21:28',
  '2025-10-14 08:21:28'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  391,
  200,
  47,
  'debit',
  200.00,
  'Petty Cash Addition: test',
  1,
  1,
  '2025-10-14 08:24:34',
  '2025-10-14 08:24:34'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  392,
  200,
  48,
  'credit',
  200.00,
  'Petty Cash Addition from Cash',
  1,
  1,
  '2025-10-14 08:24:34',
  '2025-10-14 08:24:34'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  393,
  201,
  48,
  'debit',
  500.00,
  'Petty Cash Withdrawal to Cash',
  1,
  1,
  '2025-10-14 08:35:40',
  '2025-10-14 08:35:40'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  394,
  201,
  47,
  'credit',
  500.00,
  'Petty Cash Withdrawal: submit',
  1,
  1,
  '2025-10-14 08:35:40',
  '2025-10-14 08:35:40'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  395,
  202,
  47,
  'debit',
  200.00,
  'Petty Cash Addition: test',
  1,
  1,
  '2025-10-14 08:54:16',
  '2025-10-14 08:54:16'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  396,
  202,
  48,
  'credit',
  200.00,
  'Petty Cash Addition from Cash',
  1,
  1,
  '2025-10-14 08:54:16',
  '2025-10-14 08:54:16'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  397,
  204,
  82,
  'debit',
  100.00,
  'test',
  4,
  1,
  '2025-10-14 10:00:57',
  '2025-10-14 10:00:57'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  398,
  204,
  52,
  'credit',
  100.00,
  'test',
  4,
  1,
  '2025-10-14 10:00:57',
  '2025-10-14 10:00:57'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  404,
  208,
  48,
  'credit',
  100.00,
  'Payment for test',
  4,
  1,
  '2025-10-14 13:20:38',
  '2025-10-14 13:20:38'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  405,
  209,
  52,
  'debit',
  100.00,
  'Payment for test',
  4,
  1,
  '2025-10-14 13:21:26',
  '2025-10-14 13:21:26'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  406,
  209,
  48,
  'credit',
  100.00,
  'Payment for test',
  4,
  1,
  '2025-10-14 13:21:26',
  '2025-10-14 13:21:26'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  409,
  211,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 60',
  4,
  1,
  '2025-10-20 08:48:12',
  '2025-10-20 08:48:12'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  410,
  211,
  53,
  'credit',
  20.00,
  'Admin fee income - Student 60',
  4,
  1,
  '2025-10-20 08:48:12',
  '2025-10-20 08:48:12'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  417,
  215,
  56,
  'debit',
  200.00,
  'Expenditure Request: test99',
  4,
  2,
  '2025-10-21 23:05:11',
  '2025-10-21 23:05:11'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  418,
  215,
  47,
  'credit',
  200.00,
  'Payment for: test99',
  4,
  2,
  '2025-10-21 23:05:11',
  '2025-10-21 23:05:11'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  419,
  216,
  47,
  'debit',
  20.00,
  'Initial balance for Marko Belvedere',
  5,
  1,
  '2025-10-22 08:26:18',
  '2025-10-22 08:26:18'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  420,
  217,
  47,
  'debit',
  30.00,
  'Initial balance for test st kilda',
  4,
  1,
  '2025-10-22 09:12:19',
  '2025-10-22 09:12:19'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  429,
  222,
  47,
  'debit',
  60.00,
  'monthly rent payment - Debit Petty Cash',
  4,
  1,
  '2025-10-22 09:31:44',
  '2025-10-22 09:31:44'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  430,
  222,
  51,
  'credit',
  60.00,
  'monthly rent payment - Credit Accounts Receivable',
  4,
  1,
  '2025-10-22 09:31:44',
  '2025-10-22 09:31:44'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  431,
  223,
  47,
  'debit',
  200.00,
  'Petty Cash - Branch Payment 13',
  4,
  2,
  '2025-10-22 09:35:13',
  '2025-10-22 09:35:13'
);

INSERT INTO journal_entries (
  id,
  transaction_id,
  account_id,
  entry_type,
  amount,
  description,
  boarding_house_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  432,
  223,
  51,
  'credit',
  200.00,
  'Accounts Receivable - Branch Payment 13',
  4,
  2,
  '2025-10-22 09:35:13',
  '2025-10-22 09:35:13'
);

SET FOREIGN_KEY_CHECKS = 1;

-- Sync completed
-- Transactions synced: 40
-- Journal entries synced: 77
