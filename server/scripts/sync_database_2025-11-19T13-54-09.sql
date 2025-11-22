-- Database Sync Script: Online → Localhost (ALL DATA)
-- Generated: 2025-11-19T13:54:09.439Z
-- Syncing ALL transactions and journal entries (no date filter)
-- Transactions: 201
-- Journal Entries: 399

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- Delete ALL existing journal entries
DELETE FROM journal_entries;

-- Delete ALL existing transactions
DELETE FROM transactions;

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
  13,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816377-3px42ksy6',
  'Overdue rent - Anita Gwenda - Schedule ID: 4',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  16,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816385-b3o1rpuk1',
  'Overdue rent - Lillian Chatikobo - Schedule ID: 7',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  19,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816396-0z62i5mgh',
  'Overdue rent - Sharon Matanha - Schedule ID: 10',
  98.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  22,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816404-zi8hqj73o',
  'Overdue rent - Bellis Mapetere - Schedule ID: 13',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  25,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816416-xmuoyu5ys',
  'Overdue rent - Tatenda Kamatando - Schedule ID: 16',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  28,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816425-76peq1v3c',
  'Overdue rent - Fay Mubaiwa - Schedule ID: 19',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  31,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816432-to8v7eq7s',
  'Overdue rent - Tanyaradzwa Manife - Schedule ID: 22',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  34,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816443-6pu88rjr6',
  'Overdue rent - Christine Mutsikwa - Schedule ID: 25',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  37,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816450-mlu0gglw9',
  'Overdue rent - Bertha Mwangu - Schedule ID: 28',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  40,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816458-87ravd48x',
  'Overdue rent - Merrylin Makunzva - Schedule ID: 31',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  43,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816466-j9y5gjft5',
  'Overdue rent - Shantell Mawarira - Schedule ID: 34',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  46,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816474-kkrxmvgy8',
  'Overdue rent - Salina Saidi - Schedule ID: 37',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  49,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816482-g8cakeoxq',
  'Overdue rent - Tinotenda Bwangangwanyo - Schedule ID: 40',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  52,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816489-g7tw5qeef',
  'Overdue rent - Kimberly Nkomo - Schedule ID: 43',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  55,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816501-fq60tnw5d',
  'Overdue rent - Kimberly Mutowembwa - Schedule ID: 46',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  58,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816511-qzenijgzz',
  'Overdue rent - Alicia Matamuko - Schedule ID: 49',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  61,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816517-4mmuxmag7',
  'Overdue rent - L Moyo - Schedule ID: 52',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  64,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816526-i9sn6rq81',
  'Overdue rent - Thandiwe - Schedule ID: 55',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  67,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816533-0pvevbxyf',
  'Overdue rent - Tamia Moyo - Schedule ID: 58',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  70,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816538-3vo5g8fj6',
  'Overdue rent - Tinenyasha Gozho - Schedule ID: 61',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  73,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816545-w2tz5squf',
  'Overdue rent - Candice Gavajena - Schedule ID: 64',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  76,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816550-alth6lm0n',
  'Overdue rent - Natile Forbes - Schedule ID: 67',
  100.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  79,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816556-fo072mahy',
  'Overdue rent - Panashe - Schedule ID: 70',
  16.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  82,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816562-faf1h0i23',
  'Overdue rent - Hope chibondwe - Schedule ID: 73',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  85,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816567-73wzq7b6w',
  'Overdue rent - Natilie Dhendere - Schedule ID: 76',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  88,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816575-h8qfwmeo3',
  'Overdue rent - Nicole Khumalo - Schedule ID: 79',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  91,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816580-wc4lk6612',
  'Overdue rent - Martha Buruyoyi - Schedule ID: 82',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  94,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816584-yk74xvp9i',
  'Overdue rent - Chido Dambeni - Schedule ID: 85',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  97,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816592-mkhhtxczt',
  'Overdue rent - Bridget Mugodi - Schedule ID: 88',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  100,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816596-6vtofxozi',
  'Overdue rent - Tanisha Muziwanhanga - Schedule ID: 91',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  103,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816600-8a2mkxdjq',
  'Overdue rent - Joyce Ndlovu - Schedule ID: 94',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  106,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816607-qnfuclrlb',
  'Overdue rent - Rejoice Chikwava - Schedule ID: 97',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  109,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816613-5lnq7x1m5',
  'Overdue rent - Panashe Gutuza - Schedule ID: 100',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  112,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816617-f3kz6kapz',
  'Overdue rent - Glander Makambe - Schedule ID: 103',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  115,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816623-xtqzf3yii',
  'Overdue rent - Zvikomberero Gwatidza - Schedule ID: 106',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  118,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816629-t1gl4d5vq',
  'Overdue rent - Bella Maramba - Schedule ID: 109',
  50.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  121,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816634-od8gydusr',
  'Overdue rent - Anita Gavajena - Schedule ID: 112',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  124,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816642-voschces3',
  'Overdue rent - Panashe Shaya - Schedule ID: 115',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  127,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816647-hbop3afl2',
  'Overdue rent - Tanataswa Gavajena - Schedule ID: 118',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  130,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816651-m25pvan8z',
  'Overdue rent - Sandra Nyakura - Schedule ID: 121',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  133,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816658-xwwpg1n4s',
  'Overdue rent - Mugove Bumbira - Schedule ID: 124',
  100.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  136,
  'overdue_rent',
  '2024-09-29',
  'OVERDUE-1757064816663-37hpx3mgb',
  'Overdue rent - Geraldine Mumba - Schedule ID: 127',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  14,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816381-lawmisibe',
  'Overdue rent - Anita Gwenda - Schedule ID: 5',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  17,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816389-9wpley0f3',
  'Overdue rent - Lillian Chatikobo - Schedule ID: 8',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  20,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816398-c5gh4ngi7',
  'Overdue rent - Sharon Matanha - Schedule ID: 11',
  98.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  23,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816410-7kiuc3jeh',
  'Overdue rent - Bellis Mapetere - Schedule ID: 14',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  26,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816418-o5tlsdhzb',
  'Overdue rent - Tatenda Kamatando - Schedule ID: 17',
  110.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  29,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816428-w7avb0si4',
  'Overdue rent - Fay Mubaiwa - Schedule ID: 20',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  32,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816435-k8lpeq4y1',
  'Overdue rent - Tanyaradzwa Manife - Schedule ID: 23',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  35,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816445-l7s5dj3nw',
  'Overdue rent - Christine Mutsikwa - Schedule ID: 26',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  38,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816452-6jr97jykz',
  'Overdue rent - Bertha Mwangu - Schedule ID: 29',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  41,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816461-eviywco7j',
  'Overdue rent - Merrylin Makunzva - Schedule ID: 32',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  44,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816468-wiz2ft3i3',
  'Overdue rent - Shantell Mawarira - Schedule ID: 35',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  47,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816478-ks37s9ru9',
  'Overdue rent - Salina Saidi - Schedule ID: 38',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  50,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816484-oljzoa134',
  'Overdue rent - Tinotenda Bwangangwanyo - Schedule ID: 41',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  53,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816494-l3bfpd3dd',
  'Overdue rent - Kimberly Nkomo - Schedule ID: 44',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  56,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816502-k1nvpo80m',
  'Overdue rent - Kimberly Mutowembwa - Schedule ID: 47',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  59,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816513-iubyik0k6',
  'Overdue rent - Alicia Matamuko - Schedule ID: 50',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  62,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816519-sfz0o8y6m',
  'Overdue rent - L Moyo - Schedule ID: 53',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  65,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816529-17g2ml4xa',
  'Overdue rent - Thandiwe - Schedule ID: 56',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  68,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816534-x6ektkzsj',
  'Overdue rent - Tamia Moyo - Schedule ID: 59',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  71,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816542-w2l26qixe',
  'Overdue rent - Tinenyasha Gozho - Schedule ID: 62',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  74,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816547-99il7ck4n',
  'Overdue rent - Candice Gavajena - Schedule ID: 65',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  77,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816551-5zjtbo68o',
  'Overdue rent - Natile Forbes - Schedule ID: 68',
  100.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  80,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816559-hmdbcvr4s',
  'Overdue rent - Panashe - Schedule ID: 71',
  16.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  83,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816564-qtsm6v4ya',
  'Overdue rent - Hope chibondwe - Schedule ID: 74',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  86,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816569-3cuyzcnrh',
  'Overdue rent - Natilie Dhendere - Schedule ID: 77',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  89,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816577-m83usmt7u',
  'Overdue rent - Nicole Khumalo - Schedule ID: 80',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  92,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816582-pcji0yslr',
  'Overdue rent - Martha Buruyoyi - Schedule ID: 83',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  95,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816586-w6wl88oay',
  'Overdue rent - Chido Dambeni - Schedule ID: 86',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  98,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816594-6gia3sese',
  'Overdue rent - Bridget Mugodi - Schedule ID: 89',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  101,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816598-b7lfgpezv',
  'Overdue rent - Tanisha Muziwanhanga - Schedule ID: 92',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  104,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816602-ptt694jwy',
  'Overdue rent - Joyce Ndlovu - Schedule ID: 95',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  107,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816610-amz6pakt8',
  'Overdue rent - Rejoice Chikwava - Schedule ID: 98',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  110,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816614-ipbzf1a13',
  'Overdue rent - Panashe Gutuza - Schedule ID: 101',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  113,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816618-7kdghi7vq',
  'Overdue rent - Glander Makambe - Schedule ID: 104',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  116,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816626-l68vbp68x',
  'Overdue rent - Zvikomberero Gwatidza - Schedule ID: 107',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  119,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816631-iyqqih8dv',
  'Overdue rent - Bella Maramba - Schedule ID: 110',
  50.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  122,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816636-3hemwq6ao',
  'Overdue rent - Anita Gavajena - Schedule ID: 113',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  125,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816644-wbdq6o6en',
  'Overdue rent - Panashe Shaya - Schedule ID: 116',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  128,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816648-8yn9es95q',
  'Overdue rent - Tanataswa Gavajena - Schedule ID: 119',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  131,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816652-47hxwbmrd',
  'Overdue rent - Sandra Nyakura - Schedule ID: 122',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  134,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816660-u7zba6uss',
  'Overdue rent - Mugove Bumbira - Schedule ID: 125',
  100.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  137,
  'overdue_rent',
  '2024-10-30',
  'OVERDUE-1757064816664-ngowp56ji',
  'Overdue rent - Geraldine Mumba - Schedule ID: 128',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  15,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816384-15ngl5f4u',
  'Overdue rent - Anita Gwenda - Schedule ID: 6',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  18,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816393-8govterr3',
  'Overdue rent - Lillian Chatikobo - Schedule ID: 9',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  21,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816400-6hp7i6t2u',
  'Overdue rent - Sharon Matanha - Schedule ID: 12',
  98.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  24,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816414-zi9mpzq2c',
  'Overdue rent - Bellis Mapetere - Schedule ID: 15',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  27,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816420-aq9q1199u',
  'Overdue rent - Tatenda Kamatando - Schedule ID: 18',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  30,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816430-ojutgaacw',
  'Overdue rent - Fay Mubaiwa - Schedule ID: 21',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  33,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816438-2mr2d2028',
  'Overdue rent - Tanyaradzwa Manife - Schedule ID: 24',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  36,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816448-g3g6cu0ra',
  'Overdue rent - Christine Mutsikwa - Schedule ID: 27',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  39,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816454-uamxonot9',
  'Overdue rent - Bertha Mwangu - Schedule ID: 30',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  42,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816464-lk4emzr0d',
  'Overdue rent - Merrylin Makunzva - Schedule ID: 33',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  45,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816469-esz09lcrx',
  'Overdue rent - Shantell Mawarira - Schedule ID: 36',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  48,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816479-yungyatyk',
  'Overdue rent - Salina Saidi - Schedule ID: 39',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  51,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816485-3c4dqrc0l',
  'Overdue rent - Tinotenda Bwangangwanyo - Schedule ID: 42',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  54,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816497-t1xhp3wtl',
  'Overdue rent - Kimberly Nkomo - Schedule ID: 45',
  170.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  57,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816507-umdtmophg',
  'Overdue rent - Kimberly Mutowembwa - Schedule ID: 48',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  60,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816515-fhp6o5rsz',
  'Overdue rent - Alicia Matamuko - Schedule ID: 51',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  63,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816522-2ppv16q8t',
  'Overdue rent - L Moyo - Schedule ID: 54',
  180.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:33:36'
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
  66,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816531-b72zjwzs9',
  'Overdue rent - Thandiwe - Schedule ID: 57',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  69,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816536-ig6nccz9x',
  'Overdue rent - Tamia Moyo - Schedule ID: 60',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  72,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816544-v7hbx0dsu',
  'Overdue rent - Tinenyasha Gozho - Schedule ID: 63',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  75,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816548-d07nlenyp',
  'Overdue rent - Candice Gavajena - Schedule ID: 66',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  78,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816553-h5xj2ibnx',
  'Overdue rent - Natile Forbes - Schedule ID: 69',
  100.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  81,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816561-mfyfbn2lb',
  'Overdue rent - Panashe - Schedule ID: 72',
  16.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  84,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816566-ou2v6fqxy',
  'Overdue rent - Hope chibondwe - Schedule ID: 75',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  87,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816570-myj0v4tvj',
  'Overdue rent - Natilie Dhendere - Schedule ID: 78',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  90,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816579-vismkdm1e',
  'Overdue rent - Nicole Khumalo - Schedule ID: 81',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  93,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816583-28bbgz87n',
  'Overdue rent - Martha Buruyoyi - Schedule ID: 84',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  96,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816589-px69s2fhp',
  'Overdue rent - Chido Dambeni - Schedule ID: 87',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  99,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816595-wruxifxm8',
  'Overdue rent - Bridget Mugodi - Schedule ID: 90',
  150.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  102,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816599-2bkhfxj3f',
  'Overdue rent - Tanisha Muziwanhanga - Schedule ID: 93',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  105,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816603-i8z54p720',
  'Overdue rent - Joyce Ndlovu - Schedule ID: 96',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  108,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816611-bmbde4zp5',
  'Overdue rent - Rejoice Chikwava - Schedule ID: 99',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  111,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816615-vo0h8qqsv',
  'Overdue rent - Panashe Gutuza - Schedule ID: 102',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  114,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816620-rs1m456lb',
  'Overdue rent - Glander Makambe - Schedule ID: 105',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  117,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816628-xdjiu578o',
  'Overdue rent - Zvikomberero Gwatidza - Schedule ID: 108',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  120,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816632-ao9oas39h',
  'Overdue rent - Bella Maramba - Schedule ID: 111',
  50.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  123,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816639-7g1y4fyk7',
  'Overdue rent - Anita Gavajena - Schedule ID: 114',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  126,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816645-pmtpnr0ie',
  'Overdue rent - Panashe Shaya - Schedule ID: 117',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  129,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816650-qk3vri4vb',
  'Overdue rent - Tanataswa Gavajena - Schedule ID: 120',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  132,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816654-wj1yfymyg',
  'Overdue rent - Sandra Nyakura - Schedule ID: 123',
  110.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  135,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816661-0to3sn0yh',
  'Overdue rent - Mugove Bumbira - Schedule ID: 126',
  100.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  138,
  'overdue_rent',
  '2024-11-29',
  'OVERDUE-1757064816666-nk3ipg96g',
  'Overdue rent - Geraldine Mumba - Schedule ID: 129',
  80.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:33:36'
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
  1,
  'expense',
  '2025-07-31',
  'EXP-20250901-222341',
  'EXP-20250901-222341',
  450.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-01 20:23:58'
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
  7,
  'opening_balance_set',
  '2025-07-31',
  'OB-1756763672368',
  'Opening Balance Set: Initial balance',
  2486.55,
  'USD',
  'posted',
  7,
  1,
  '2025-09-01 21:54:32'
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
  8,
  'opening_balance_set',
  '2025-07-31',
  'OB-1756763709157',
  'Opening Balance Set: Initial balance',
  2800.00,
  'USD',
  'posted',
  7,
  1,
  '2025-09-01 21:55:09'
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
  9,
  'opening_balance_set',
  '2025-07-31',
  'OB-1756763739419',
  'Opening Balance Set: Initial balance',
  629.19,
  'USD',
  'posted',
  7,
  1,
  '2025-09-01 21:55:39'
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
  10,
  'petty_cash_addition',
  '2025-07-31',
  'PCA-2025-08-01-001',
  'Petty cash addition from Cash',
  600.00,
  'USD',
  'posted',
  1,
  1,
  '2025-07-31 22:00:00'
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
  142,
  'petty_cash_addition',
  '2025-07-31',
  '16789H',
  'Petty Cash Addition: Balance c/d august',
  3.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:45:17'
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
  151,
  'petty_cash_addition',
  '2025-07-31',
  'Rental submitted',
  'Petty Cash Addition: Rental submitted',
  346.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:09:31'
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
  152,
  'petty_cash_withdrawal',
  '2025-07-31',
  'Rental submitted',
  'Petty Cash Withdrawal: Rental submitted',
  346.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:11:39'
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
  153,
  'petty_cash_withdrawal',
  '2025-07-31',
  'Rental submitted',
  'Petty Cash Withdrawal: Rental submitted',
  346.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:12:51'
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
  143,
  'petty_cash_addition',
  '2025-08-01',
  'NYOUENAO',
  'Petty Cash Addition: Petty cash replinishment',
  70.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:46:15'
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
  149,
  'expense',
  '2025-08-03',
  'EXP-20250907-210245',
  'Gas',
  90.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:03:09'
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
  154,
  'petty_cash_withdrawal',
  '2025-08-03',
  ' Rental submitted ',
  'Petty Cash Withdrawal:  Rental submitted ',
  1130.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:13:46'
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
  2,
  'expense',
  '2025-08-04',
  'EXP-20250901-223136',
  'EXP-20250901-223136',
  127.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-01 20:32:12'
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
  3,
  'expense',
  '2025-08-04',
  'EXP-20250901-223307',
  'EXP-20250901-223307',
  30.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-01 20:33:28'
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
  144,
  'expense',
  '2025-08-04',
  'EXP-20250907-204653',
  'House-keeping',
  20.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:47:26'
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
  145,
  'expense',
  '2025-08-04',
  'EXP-20250907-204848',
  'Cleaning supplies',
  49.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:49:20'
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
  150,
  'expense',
  '2025-08-05',
  'EXP-20250907-210537',
  'Neighbourhood watch',
  30.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:07:46'
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
  155,
  'petty_cash_withdrawal',
  '2025-08-05',
  'Rental submitted',
  'Petty Cash Withdrawal: Rental submitted',
  200.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:14:27'
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
  4,
  'expense',
  '2025-08-07',
  'EXP-20250901-223737',
  'EXP-20250901-223737',
  100.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-01 20:37:51'
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
  11,
  'petty_cash_addition',
  '2025-08-07',
  'PCA-2025-08-08-001',
  'Petty cash addition from Cash',
  100.00,
  'USD',
  'posted',
  1,
  1,
  '2025-08-07 22:00:00'
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
  146,
  'petty_cash_addition',
  '2025-08-13',
  'PETTYCASH',
  'Petty Cash Addition: PETTY CASH REPLENISHMENT',
  170.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:50:33'
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
  147,
  'expense',
  '2025-08-13',
  'EXP-20250907-205126',
  'Modern relocation',
  169.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:51:54'
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
  12,
  'petty_cash_addition',
  '2025-08-18',
  'PCA-2025-08-19-001',
  'Petty cash addition from Cash',
  1319.00,
  'USD',
  'posted',
  1,
  1,
  '2025-08-18 22:00:00'
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
  5,
  'expense',
  '2025-08-19',
  'EXP-20250901-224037',
  'Terminte treatment',
  350.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-01 20:41:05'
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
  140,
  'student_payment',
  '2025-08-19',
  'STU-PAY-4-1757065908398',
  'Student payments - Boarding House 4',
  1960.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-05 09:51:48'
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
  141,
  'student_payment',
  '2025-08-19',
  'STU-PAY-5-1757065908405',
  'Student payments - Boarding House 5',
  2381.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-05 09:51:48'
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
  148,
  'petty_cash_addition',
  '2025-08-19',
  'Petty Cash',
  'Petty Cash Addition: Petty Cash',
  120.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 18:52:19'
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
  6,
  'expense',
  '2025-08-20',
  'EXP-20250901-224145',
  'Plumbing and washing line',
  227.00,
  'USD',
  'posted',
  4,
  1,
  '2025-09-01 20:42:11'
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
  157,
  'expense',
  '2025-08-27',
  'EXP-20250907-212117',
  'Alamait management fee',
  500.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:21:49'
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
  210,
  'initial_invoice',
  '2025-08-31',
  'INV-1760949936347-3zfegocnz',
  'Initial invoice - Student',
  160.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-20 08:45:36'
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
  212,
  'initial_invoice',
  '2025-08-31',
  'INV-1760950092240-rs3wn5dmk',
  'Initial invoice - Student',
  210.00,
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
  158,
  'expense',
  '2025-09-02',
  'EXP-20251002-090321',
  'water refill',
  250.00,
  'USD',
  'posted',
  4,
  1,
  '2025-10-02 07:03:43'
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
  214,
  'expense',
  '2025-09-02',
  'EXP-REQ-3',
  'Expenditure Request: House through cleaning',
  500.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-21 22:56:04'
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
  156,
  'petty_cash_addition',
  '2025-09-06',
  'Petty Cash',
  'Petty Cash Addition: Petty Cash',
  17.00,
  'USD',
  'posted',
  5,
  1,
  '2025-09-07 19:14:46'
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
  213,
  'expense',
  '2025-09-08',
  'EXP-REQ-2',
  'Expenditure Request: Electricity',
  200.00,
  'USD',
  'posted',
  4,
  2,
  '2025-10-21 22:48:48'
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
  1,
  1,
  65,
  'debit',
  450.00,
  'EXP-20250901-222341 - Expense',
  10,
  1,
  '2025-09-01 20:23:58',
  '2025-09-01 20:23:58'
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
  2,
  1,
  47,
  'credit',
  450.00,
  'EXP-20250901-222341 - Payment',
  10,
  1,
  '2025-09-01 20:23:58',
  '2025-09-01 20:23:58'
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
  5,
  2,
  63,
  'debit',
  127.00,
  'EXP-20250901-223136',
  10,
  1,
  '2025-09-01 20:32:28',
  '2025-09-01 20:32:28'
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
  6,
  2,
  47,
  'credit',
  127.00,
  'EXP-20250901-223136',
  10,
  1,
  '2025-09-01 20:32:28',
  '2025-09-01 20:32:28'
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
  7,
  3,
  64,
  'debit',
  30.00,
  'EXP-20250901-223307 - Expense',
  10,
  1,
  '2025-09-01 20:33:28',
  '2025-09-01 20:33:28'
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
  8,
  3,
  47,
  'credit',
  30.00,
  'EXP-20250901-223307 - Payment',
  10,
  1,
  '2025-09-01 20:33:28',
  '2025-09-01 20:33:28'
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
  9,
  4,
  80,
  'debit',
  100.00,
  'EXP-20250901-223737 - Expense',
  10,
  1,
  '2025-09-01 20:37:51',
  '2025-09-01 20:37:51'
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
  10,
  4,
  47,
  'credit',
  100.00,
  'EXP-20250901-223737 - Payment',
  10,
  1,
  '2025-09-01 20:37:51',
  '2025-09-01 20:37:51'
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
  11,
  5,
  55,
  'debit',
  350.00,
  'Terminte treatment - Expense',
  10,
  1,
  '2025-09-01 20:41:05',
  '2025-09-01 20:41:05'
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
  12,
  5,
  47,
  'credit',
  350.00,
  'Terminte treatment - Payment',
  10,
  1,
  '2025-09-01 20:41:05',
  '2025-09-01 20:41:05'
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
  13,
  6,
  55,
  'debit',
  227.00,
  'Plumbing and washing line - Expense',
  10,
  1,
  '2025-09-01 20:42:11',
  '2025-09-01 20:42:11'
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
  14,
  6,
  47,
  'credit',
  227.00,
  'Plumbing and washing line - Payment',
  10,
  1,
  '2025-09-01 20:42:11',
  '2025-09-01 20:42:11'
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
  15,
  7,
  48,
  'debit',
  2486.55,
  'Opening Balance Set: Initial balance',
  10,
  1,
  '2025-09-01 21:54:32',
  '2025-09-01 21:54:32'
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
  16,
  7,
  81,
  'credit',
  2486.55,
  'Opening Balance for Cash',
  10,
  1,
  '2025-09-01 21:54:32',
  '2025-09-01 21:54:32'
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
  17,
  8,
  50,
  'debit',
  2800.00,
  'Opening Balance Set: Initial balance',
  10,
  1,
  '2025-09-01 21:55:09',
  '2025-09-01 21:55:09'
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
  18,
  8,
  81,
  'credit',
  2800.00,
  'Opening Balance for CBZ Vault',
  10,
  1,
  '2025-09-01 21:55:09',
  '2025-09-01 21:55:09'
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
  19,
  9,
  49,
  'debit',
  629.19,
  'Opening Balance Set: Initial balance',
  10,
  1,
  '2025-09-01 21:55:39',
  '2025-09-01 21:55:39'
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
  20,
  9,
  81,
  'credit',
  629.19,
  'Opening Balance for CBZ Bank Account',
  10,
  1,
  '2025-09-01 21:55:39',
  '2025-09-01 21:55:39'
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
  21,
  10,
  47,
  'debit',
  600.00,
  'Petty cash addition from Cash',
  10,
  1,
  '2025-09-01 22:15:26',
  '2025-09-01 22:15:26'
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
  22,
  10,
  48,
  'credit',
  600.00,
  'Petty cash addition from Cash',
  10,
  1,
  '2025-09-01 22:15:26',
  '2025-09-01 22:15:26'
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
  23,
  11,
  47,
  'debit',
  100.00,
  'Petty cash addition from Cash',
  10,
  1,
  '2025-09-01 22:15:26',
  '2025-09-01 22:15:26'
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
  24,
  11,
  48,
  'credit',
  100.00,
  'Petty cash addition from Cash',
  10,
  1,
  '2025-09-01 22:15:26',
  '2025-09-01 22:15:26'
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
  25,
  12,
  47,
  'debit',
  1319.00,
  'Petty cash addition from Cash',
  10,
  1,
  '2025-09-01 22:15:26',
  '2025-09-01 22:15:26'
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
  26,
  12,
  48,
  'credit',
  1319.00,
  'Petty cash addition from Cash',
  10,
  1,
  '2025-09-01 22:15:26',
  '2025-09-01 22:15:26'
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
  27,
  13,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Anita Gwenda',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  28,
  13,
  53,
  'credit',
  160.00,
  'Overdue rent income - Anita Gwenda',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  29,
  14,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Anita Gwenda',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  30,
  14,
  53,
  'credit',
  160.00,
  'Overdue rent income - Anita Gwenda',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  31,
  15,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Anita Gwenda',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  32,
  15,
  53,
  'credit',
  160.00,
  'Overdue rent income - Anita Gwenda',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  33,
  16,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Lillian Chatikobo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  34,
  16,
  53,
  'credit',
  180.00,
  'Overdue rent income - Lillian Chatikobo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  35,
  17,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Lillian Chatikobo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  36,
  17,
  53,
  'credit',
  180.00,
  'Overdue rent income - Lillian Chatikobo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  37,
  18,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Lillian Chatikobo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  38,
  18,
  53,
  'credit',
  180.00,
  'Overdue rent income - Lillian Chatikobo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  39,
  19,
  51,
  'debit',
  98.00,
  'Overdue rent receivable - Sharon Matanha',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  40,
  19,
  53,
  'credit',
  98.00,
  'Overdue rent income - Sharon Matanha',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  41,
  20,
  51,
  'debit',
  98.00,
  'Overdue rent receivable - Sharon Matanha',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  42,
  20,
  53,
  'credit',
  98.00,
  'Overdue rent income - Sharon Matanha',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  43,
  21,
  51,
  'debit',
  98.00,
  'Overdue rent receivable - Sharon Matanha',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  44,
  21,
  53,
  'credit',
  98.00,
  'Overdue rent income - Sharon Matanha',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  45,
  22,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Bellis Mapetere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  46,
  22,
  53,
  'credit',
  180.00,
  'Overdue rent income - Bellis Mapetere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  47,
  23,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Bellis Mapetere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  48,
  23,
  53,
  'credit',
  180.00,
  'Overdue rent income - Bellis Mapetere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  49,
  24,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Bellis Mapetere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  50,
  24,
  53,
  'credit',
  180.00,
  'Overdue rent income - Bellis Mapetere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  51,
  25,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Tatenda Kamatando',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  52,
  25,
  53,
  'credit',
  160.00,
  'Overdue rent income - Tatenda Kamatando',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  53,
  26,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tatenda Kamatando',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  54,
  26,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tatenda Kamatando',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  55,
  27,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Tatenda Kamatando',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  56,
  27,
  53,
  'credit',
  160.00,
  'Overdue rent income - Tatenda Kamatando',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  57,
  28,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Fay Mubaiwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  58,
  28,
  53,
  'credit',
  160.00,
  'Overdue rent income - Fay Mubaiwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  59,
  29,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Fay Mubaiwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  60,
  29,
  53,
  'credit',
  160.00,
  'Overdue rent income - Fay Mubaiwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  61,
  30,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Fay Mubaiwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  62,
  30,
  53,
  'credit',
  160.00,
  'Overdue rent income - Fay Mubaiwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  63,
  31,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Tanyaradzwa Manife',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  64,
  31,
  53,
  'credit',
  160.00,
  'Overdue rent income - Tanyaradzwa Manife',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  65,
  32,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Tanyaradzwa Manife',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  66,
  32,
  53,
  'credit',
  160.00,
  'Overdue rent income - Tanyaradzwa Manife',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  67,
  33,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Tanyaradzwa Manife',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  68,
  33,
  53,
  'credit',
  160.00,
  'Overdue rent income - Tanyaradzwa Manife',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  69,
  34,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Christine Mutsikwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  70,
  34,
  53,
  'credit',
  160.00,
  'Overdue rent income - Christine Mutsikwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  71,
  35,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Christine Mutsikwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  72,
  35,
  53,
  'credit',
  160.00,
  'Overdue rent income - Christine Mutsikwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  73,
  36,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Christine Mutsikwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  74,
  36,
  53,
  'credit',
  160.00,
  'Overdue rent income - Christine Mutsikwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  75,
  37,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Bertha Mwangu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  76,
  37,
  53,
  'credit',
  160.00,
  'Overdue rent income - Bertha Mwangu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  77,
  38,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Bertha Mwangu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  78,
  38,
  53,
  'credit',
  160.00,
  'Overdue rent income - Bertha Mwangu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  79,
  39,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Bertha Mwangu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  80,
  39,
  53,
  'credit',
  160.00,
  'Overdue rent income - Bertha Mwangu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  81,
  40,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Merrylin Makunzva',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  82,
  40,
  53,
  'credit',
  160.00,
  'Overdue rent income - Merrylin Makunzva',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  83,
  41,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Merrylin Makunzva',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  84,
  41,
  53,
  'credit',
  160.00,
  'Overdue rent income - Merrylin Makunzva',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  85,
  42,
  51,
  'debit',
  160.00,
  'Overdue rent receivable - Merrylin Makunzva',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  86,
  42,
  53,
  'credit',
  160.00,
  'Overdue rent income - Merrylin Makunzva',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  87,
  43,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Shantell Mawarira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  88,
  43,
  53,
  'credit',
  180.00,
  'Overdue rent income - Shantell Mawarira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  89,
  44,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Shantell Mawarira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  90,
  44,
  53,
  'credit',
  180.00,
  'Overdue rent income - Shantell Mawarira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  91,
  45,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Shantell Mawarira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  92,
  45,
  53,
  'credit',
  180.00,
  'Overdue rent income - Shantell Mawarira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  93,
  46,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Salina Saidi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  94,
  46,
  53,
  'credit',
  170.00,
  'Overdue rent income - Salina Saidi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  95,
  47,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Salina Saidi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  96,
  47,
  53,
  'credit',
  170.00,
  'Overdue rent income - Salina Saidi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  97,
  48,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Salina Saidi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  98,
  48,
  53,
  'credit',
  170.00,
  'Overdue rent income - Salina Saidi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  99,
  49,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Tinotenda Bwangangwanyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  100,
  49,
  53,
  'credit',
  170.00,
  'Overdue rent income - Tinotenda Bwangangwanyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  101,
  50,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Tinotenda Bwangangwanyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  102,
  50,
  53,
  'credit',
  170.00,
  'Overdue rent income - Tinotenda Bwangangwanyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  103,
  51,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Tinotenda Bwangangwanyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  104,
  51,
  53,
  'credit',
  170.00,
  'Overdue rent income - Tinotenda Bwangangwanyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  105,
  52,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Kimberly Nkomo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  106,
  52,
  53,
  'credit',
  170.00,
  'Overdue rent income - Kimberly Nkomo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  107,
  53,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Kimberly Nkomo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  108,
  53,
  53,
  'credit',
  170.00,
  'Overdue rent income - Kimberly Nkomo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  109,
  54,
  51,
  'debit',
  170.00,
  'Overdue rent receivable - Kimberly Nkomo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  110,
  54,
  53,
  'credit',
  170.00,
  'Overdue rent income - Kimberly Nkomo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  111,
  55,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Kimberly Mutowembwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  112,
  55,
  53,
  'credit',
  180.00,
  'Overdue rent income - Kimberly Mutowembwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  113,
  56,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Kimberly Mutowembwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  114,
  56,
  53,
  'credit',
  180.00,
  'Overdue rent income - Kimberly Mutowembwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  115,
  57,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Kimberly Mutowembwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  116,
  57,
  53,
  'credit',
  180.00,
  'Overdue rent income - Kimberly Mutowembwa',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  117,
  58,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Alicia Matamuko',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  118,
  58,
  53,
  'credit',
  180.00,
  'Overdue rent income - Alicia Matamuko',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  119,
  59,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Alicia Matamuko',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  120,
  59,
  53,
  'credit',
  180.00,
  'Overdue rent income - Alicia Matamuko',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  121,
  60,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - Alicia Matamuko',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  122,
  60,
  53,
  'credit',
  180.00,
  'Overdue rent income - Alicia Matamuko',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  123,
  61,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - L Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  124,
  61,
  53,
  'credit',
  180.00,
  'Overdue rent income - L Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  125,
  62,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - L Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  126,
  62,
  53,
  'credit',
  180.00,
  'Overdue rent income - L Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  127,
  63,
  51,
  'debit',
  180.00,
  'Overdue rent receivable - L Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  128,
  63,
  53,
  'credit',
  180.00,
  'Overdue rent income - L Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  129,
  64,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Thandiwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  130,
  64,
  53,
  'credit',
  150.00,
  'Overdue rent income - Thandiwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  131,
  65,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Thandiwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  132,
  65,
  53,
  'credit',
  150.00,
  'Overdue rent income - Thandiwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  133,
  66,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Thandiwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  134,
  66,
  53,
  'credit',
  150.00,
  'Overdue rent income - Thandiwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  135,
  67,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tamia Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  136,
  67,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tamia Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  137,
  68,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tamia Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  138,
  68,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tamia Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  139,
  69,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tamia Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  140,
  69,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tamia Moyo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  141,
  70,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tinenyasha Gozho',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  142,
  70,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tinenyasha Gozho',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  143,
  71,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tinenyasha Gozho',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  144,
  71,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tinenyasha Gozho',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  145,
  72,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Tinenyasha Gozho',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  146,
  72,
  53,
  'credit',
  110.00,
  'Overdue rent income - Tinenyasha Gozho',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  147,
  73,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Candice Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  148,
  73,
  53,
  'credit',
  80.00,
  'Overdue rent income - Candice Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  149,
  74,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Candice Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  150,
  74,
  53,
  'credit',
  80.00,
  'Overdue rent income - Candice Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  151,
  75,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Candice Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  152,
  75,
  53,
  'credit',
  80.00,
  'Overdue rent income - Candice Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  153,
  76,
  51,
  'debit',
  100.00,
  'Overdue rent receivable - Natile Forbes',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  154,
  76,
  53,
  'credit',
  100.00,
  'Overdue rent income - Natile Forbes',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  155,
  77,
  51,
  'debit',
  100.00,
  'Overdue rent receivable - Natile Forbes',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  156,
  77,
  53,
  'credit',
  100.00,
  'Overdue rent income - Natile Forbes',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  157,
  78,
  51,
  'debit',
  100.00,
  'Overdue rent receivable - Natile Forbes',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  158,
  78,
  53,
  'credit',
  100.00,
  'Overdue rent income - Natile Forbes',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  159,
  79,
  51,
  'debit',
  16.00,
  'Overdue rent receivable - Panashe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  160,
  79,
  53,
  'credit',
  16.00,
  'Overdue rent income - Panashe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  161,
  80,
  51,
  'debit',
  16.00,
  'Overdue rent receivable - Panashe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  162,
  80,
  53,
  'credit',
  16.00,
  'Overdue rent income - Panashe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  163,
  81,
  51,
  'debit',
  16.00,
  'Overdue rent receivable - Panashe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  164,
  81,
  53,
  'credit',
  16.00,
  'Overdue rent income - Panashe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  165,
  82,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Hope chibondwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  166,
  82,
  53,
  'credit',
  90.00,
  'Overdue rent income - Hope chibondwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  167,
  83,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Hope chibondwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  168,
  83,
  53,
  'credit',
  90.00,
  'Overdue rent income - Hope chibondwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  169,
  84,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Hope chibondwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  170,
  84,
  53,
  'credit',
  90.00,
  'Overdue rent income - Hope chibondwe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  171,
  85,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Natilie Dhendere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  172,
  85,
  53,
  'credit',
  110.00,
  'Overdue rent income - Natilie Dhendere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  173,
  86,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Natilie Dhendere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  174,
  86,
  53,
  'credit',
  110.00,
  'Overdue rent income - Natilie Dhendere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  175,
  87,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Natilie Dhendere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  176,
  87,
  53,
  'credit',
  110.00,
  'Overdue rent income - Natilie Dhendere',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  177,
  88,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Nicole Khumalo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  178,
  88,
  53,
  'credit',
  150.00,
  'Overdue rent income - Nicole Khumalo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  179,
  89,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Nicole Khumalo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  180,
  89,
  53,
  'credit',
  150.00,
  'Overdue rent income - Nicole Khumalo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  181,
  90,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Nicole Khumalo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  182,
  90,
  53,
  'credit',
  150.00,
  'Overdue rent income - Nicole Khumalo',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  183,
  91,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Martha Buruyoyi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  184,
  91,
  53,
  'credit',
  110.00,
  'Overdue rent income - Martha Buruyoyi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  185,
  92,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Martha Buruyoyi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  186,
  92,
  53,
  'credit',
  110.00,
  'Overdue rent income - Martha Buruyoyi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  187,
  93,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Martha Buruyoyi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  188,
  93,
  53,
  'credit',
  110.00,
  'Overdue rent income - Martha Buruyoyi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  189,
  94,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Chido Dambeni',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  190,
  94,
  53,
  'credit',
  110.00,
  'Overdue rent income - Chido Dambeni',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  191,
  95,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Chido Dambeni',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  192,
  95,
  53,
  'credit',
  110.00,
  'Overdue rent income - Chido Dambeni',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  193,
  96,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Chido Dambeni',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  194,
  96,
  53,
  'credit',
  110.00,
  'Overdue rent income - Chido Dambeni',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  195,
  97,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Bridget Mugodi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  196,
  97,
  53,
  'credit',
  150.00,
  'Overdue rent income - Bridget Mugodi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  197,
  98,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Bridget Mugodi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  198,
  98,
  53,
  'credit',
  150.00,
  'Overdue rent income - Bridget Mugodi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  199,
  99,
  51,
  'debit',
  150.00,
  'Overdue rent receivable - Bridget Mugodi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  200,
  99,
  53,
  'credit',
  150.00,
  'Overdue rent income - Bridget Mugodi',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  201,
  100,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Tanisha Muziwanhanga',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  202,
  100,
  53,
  'credit',
  90.00,
  'Overdue rent income - Tanisha Muziwanhanga',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  203,
  101,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Tanisha Muziwanhanga',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  204,
  101,
  53,
  'credit',
  90.00,
  'Overdue rent income - Tanisha Muziwanhanga',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  205,
  102,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Tanisha Muziwanhanga',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  206,
  102,
  53,
  'credit',
  90.00,
  'Overdue rent income - Tanisha Muziwanhanga',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  207,
  103,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Joyce Ndlovu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  208,
  103,
  53,
  'credit',
  110.00,
  'Overdue rent income - Joyce Ndlovu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  209,
  104,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Joyce Ndlovu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  210,
  104,
  53,
  'credit',
  110.00,
  'Overdue rent income - Joyce Ndlovu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  211,
  105,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Joyce Ndlovu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  212,
  105,
  53,
  'credit',
  110.00,
  'Overdue rent income - Joyce Ndlovu',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  213,
  106,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Rejoice Chikwava',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  214,
  106,
  53,
  'credit',
  80.00,
  'Overdue rent income - Rejoice Chikwava',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  215,
  107,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Rejoice Chikwava',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  216,
  107,
  53,
  'credit',
  80.00,
  'Overdue rent income - Rejoice Chikwava',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  217,
  108,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Rejoice Chikwava',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  218,
  108,
  53,
  'credit',
  80.00,
  'Overdue rent income - Rejoice Chikwava',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  219,
  109,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Panashe Gutuza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  220,
  109,
  53,
  'credit',
  90.00,
  'Overdue rent income - Panashe Gutuza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  221,
  110,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Panashe Gutuza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  222,
  110,
  53,
  'credit',
  90.00,
  'Overdue rent income - Panashe Gutuza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  223,
  111,
  51,
  'debit',
  90.00,
  'Overdue rent receivable - Panashe Gutuza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  224,
  111,
  53,
  'credit',
  90.00,
  'Overdue rent income - Panashe Gutuza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  225,
  112,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Glander Makambe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  226,
  112,
  53,
  'credit',
  110.00,
  'Overdue rent income - Glander Makambe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  227,
  113,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Glander Makambe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  228,
  113,
  53,
  'credit',
  110.00,
  'Overdue rent income - Glander Makambe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  229,
  114,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Glander Makambe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  230,
  114,
  53,
  'credit',
  110.00,
  'Overdue rent income - Glander Makambe',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  231,
  115,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Zvikomberero Gwatidza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  232,
  115,
  53,
  'credit',
  80.00,
  'Overdue rent income - Zvikomberero Gwatidza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  233,
  116,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Zvikomberero Gwatidza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  234,
  116,
  53,
  'credit',
  80.00,
  'Overdue rent income - Zvikomberero Gwatidza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  235,
  117,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Zvikomberero Gwatidza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  236,
  117,
  53,
  'credit',
  80.00,
  'Overdue rent income - Zvikomberero Gwatidza',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  237,
  118,
  51,
  'debit',
  50.00,
  'Overdue rent receivable - Bella Maramba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  238,
  118,
  53,
  'credit',
  50.00,
  'Overdue rent income - Bella Maramba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  239,
  119,
  51,
  'debit',
  50.00,
  'Overdue rent receivable - Bella Maramba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  240,
  119,
  53,
  'credit',
  50.00,
  'Overdue rent income - Bella Maramba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  241,
  120,
  51,
  'debit',
  50.00,
  'Overdue rent receivable - Bella Maramba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  242,
  120,
  53,
  'credit',
  50.00,
  'Overdue rent income - Bella Maramba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  243,
  121,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Anita Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  244,
  121,
  53,
  'credit',
  80.00,
  'Overdue rent income - Anita Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  245,
  122,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Anita Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  246,
  122,
  53,
  'credit',
  80.00,
  'Overdue rent income - Anita Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  247,
  123,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Anita Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  248,
  123,
  53,
  'credit',
  80.00,
  'Overdue rent income - Anita Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  249,
  124,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Panashe Shaya',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  250,
  124,
  53,
  'credit',
  110.00,
  'Overdue rent income - Panashe Shaya',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  251,
  125,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Panashe Shaya',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  252,
  125,
  53,
  'credit',
  110.00,
  'Overdue rent income - Panashe Shaya',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  253,
  126,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Panashe Shaya',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  254,
  126,
  53,
  'credit',
  110.00,
  'Overdue rent income - Panashe Shaya',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  255,
  127,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Tanataswa Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  256,
  127,
  53,
  'credit',
  80.00,
  'Overdue rent income - Tanataswa Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  257,
  128,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Tanataswa Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  258,
  128,
  53,
  'credit',
  80.00,
  'Overdue rent income - Tanataswa Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  259,
  129,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Tanataswa Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  260,
  129,
  53,
  'credit',
  80.00,
  'Overdue rent income - Tanataswa Gavajena',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  261,
  130,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Sandra Nyakura',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  262,
  130,
  53,
  'credit',
  110.00,
  'Overdue rent income - Sandra Nyakura',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  263,
  131,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Sandra Nyakura',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  264,
  131,
  53,
  'credit',
  110.00,
  'Overdue rent income - Sandra Nyakura',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  265,
  132,
  51,
  'debit',
  110.00,
  'Overdue rent receivable - Sandra Nyakura',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  266,
  132,
  53,
  'credit',
  110.00,
  'Overdue rent income - Sandra Nyakura',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  267,
  133,
  51,
  'debit',
  100.00,
  'Overdue rent receivable - Mugove Bumbira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  268,
  133,
  53,
  'credit',
  100.00,
  'Overdue rent income - Mugove Bumbira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  269,
  134,
  51,
  'debit',
  100.00,
  'Overdue rent receivable - Mugove Bumbira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  270,
  134,
  53,
  'credit',
  100.00,
  'Overdue rent income - Mugove Bumbira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  271,
  135,
  51,
  'debit',
  100.00,
  'Overdue rent receivable - Mugove Bumbira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  272,
  135,
  53,
  'credit',
  100.00,
  'Overdue rent income - Mugove Bumbira',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  273,
  136,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Geraldine Mumba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  274,
  136,
  53,
  'credit',
  80.00,
  'Overdue rent income - Geraldine Mumba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  275,
  137,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Geraldine Mumba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  276,
  137,
  53,
  'credit',
  80.00,
  'Overdue rent income - Geraldine Mumba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  277,
  138,
  51,
  'debit',
  80.00,
  'Overdue rent receivable - Geraldine Mumba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  278,
  138,
  53,
  'credit',
  80.00,
  'Overdue rent income - Geraldine Mumba',
  10,
  1,
  '2025-09-05 09:33:36',
  '2025-09-05 09:33:36'
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
  281,
  140,
  47,
  'debit',
  1960.00,
  'Student payment - Debit Petty Cash',
  10,
  1,
  '2025-08-19 22:00:00',
  '2025-09-05 10:02:39'
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
  282,
  140,
  53,
  'credit',
  1960.00,
  'Student payment - Credit Student Revenue',
  10,
  1,
  '2025-08-19 22:00:00',
  '2025-09-05 10:02:39'
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
  283,
  141,
  47,
  'debit',
  2381.00,
  'Student payment - Debit Petty Cash',
  10,
  1,
  '2025-08-19 22:00:00',
  '2025-09-05 10:02:39'
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
  284,
  141,
  53,
  'credit',
  2381.00,
  'Student payment - Credit Student Revenue',
  10,
  1,
  '2025-08-19 22:00:00',
  '2025-09-05 10:02:39'
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
  285,
  142,
  47,
  'debit',
  3.00,
  'Petty Cash Addition: Balance c/d august',
  10,
  1,
  '2025-09-07 18:45:17',
  '2025-09-07 18:45:17'
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
  286,
  142,
  48,
  'credit',
  3.00,
  'Petty Cash Addition from Cash',
  10,
  1,
  '2025-09-07 18:45:17',
  '2025-09-07 18:45:17'
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
  287,
  143,
  47,
  'debit',
  70.00,
  'Petty Cash Addition: Petty cash replinishment',
  10,
  1,
  '2025-09-07 18:46:15',
  '2025-09-07 18:46:15'
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
  288,
  143,
  48,
  'credit',
  70.00,
  'Petty Cash Addition from Cash',
  10,
  1,
  '2025-09-07 18:46:15',
  '2025-09-07 18:46:15'
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
  289,
  144,
  64,
  'debit',
  20.00,
  'House-keeping - Expense',
  10,
  1,
  '2025-09-07 18:47:26',
  '2025-09-07 18:47:26'
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
  290,
  144,
  47,
  'credit',
  20.00,
  'House-keeping - Payment',
  10,
  1,
  '2025-09-07 18:47:26',
  '2025-09-07 18:47:26'
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
  291,
  145,
  64,
  'debit',
  49.00,
  'Cleaning supplies - Expense',
  10,
  1,
  '2025-09-07 18:49:20',
  '2025-09-07 18:49:20'
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
  292,
  145,
  47,
  'credit',
  49.00,
  'Cleaning supplies - Payment',
  10,
  1,
  '2025-09-07 18:49:20',
  '2025-09-07 18:49:20'
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
  293,
  146,
  47,
  'debit',
  170.00,
  'Petty Cash Addition: PETTY CASH REPLENISHMENT',
  10,
  1,
  '2025-09-07 18:50:33',
  '2025-09-07 18:50:33'
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
  294,
  146,
  48,
  'credit',
  170.00,
  'Petty Cash Addition from Cash',
  10,
  1,
  '2025-09-07 18:50:33',
  '2025-09-07 18:50:33'
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
  295,
  147,
  55,
  'debit',
  169.00,
  'Modern relocation - Expense',
  10,
  1,
  '2025-09-07 18:51:54',
  '2025-09-07 18:51:54'
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
  296,
  147,
  47,
  'credit',
  169.00,
  'Modern relocation - Payment',
  10,
  1,
  '2025-09-07 18:51:54',
  '2025-09-07 18:51:54'
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
  297,
  148,
  47,
  'debit',
  120.00,
  'Petty Cash Addition: Petty Cash',
  10,
  1,
  '2025-09-07 18:52:19',
  '2025-09-07 18:52:19'
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
  298,
  148,
  48,
  'credit',
  120.00,
  'Petty Cash Addition from Cash',
  10,
  1,
  '2025-09-07 18:52:19',
  '2025-09-07 18:52:19'
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
  299,
  149,
  61,
  'debit',
  90.00,
  'Gas - Expense',
  10,
  1,
  '2025-09-07 19:03:09',
  '2025-09-07 19:03:09'
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
  300,
  149,
  47,
  'credit',
  90.00,
  'Gas - Payment',
  10,
  1,
  '2025-09-07 19:03:09',
  '2025-09-07 19:03:09'
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
  301,
  150,
  64,
  'debit',
  30.00,
  'Neighbourhood watch - Expense',
  10,
  1,
  '2025-09-07 19:07:46',
  '2025-09-07 19:07:46'
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
  302,
  150,
  47,
  'credit',
  30.00,
  'Neighbourhood watch - Payment',
  10,
  1,
  '2025-09-07 19:07:46',
  '2025-09-07 19:07:46'
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
  303,
  151,
  47,
  'debit',
  346.00,
  'Petty Cash Addition: Rental submitted',
  10,
  1,
  '2025-09-07 19:09:31',
  '2025-09-07 19:09:31'
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
  304,
  151,
  48,
  'credit',
  346.00,
  'Petty Cash Addition from Cash',
  10,
  1,
  '2025-09-07 19:09:31',
  '2025-09-07 19:09:31'
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
  305,
  152,
  48,
  'debit',
  346.00,
  'Petty Cash Withdrawal to Cash',
  10,
  1,
  '2025-09-07 19:11:39',
  '2025-09-07 19:11:39'
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
  306,
  152,
  47,
  'credit',
  346.00,
  'Petty Cash Withdrawal: Rental submitted',
  10,
  1,
  '2025-09-07 19:11:39',
  '2025-09-07 19:11:39'
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
  307,
  153,
  48,
  'debit',
  346.00,
  'Petty Cash Withdrawal to Cash',
  10,
  1,
  '2025-09-07 19:12:51',
  '2025-09-07 19:12:51'
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
  308,
  153,
  47,
  'credit',
  346.00,
  'Petty Cash Withdrawal: Rental submitted',
  10,
  1,
  '2025-09-07 19:12:51',
  '2025-09-07 19:12:51'
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
  309,
  154,
  48,
  'debit',
  1130.00,
  'Petty Cash Withdrawal to Cash',
  10,
  1,
  '2025-09-07 19:13:46',
  '2025-09-07 19:13:46'
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
  310,
  154,
  47,
  'credit',
  1130.00,
  'Petty Cash Withdrawal:  Rental submitted ',
  10,
  1,
  '2025-09-07 19:13:46',
  '2025-09-07 19:13:46'
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
  311,
  155,
  48,
  'debit',
  200.00,
  'Petty Cash Withdrawal to Cash',
  10,
  1,
  '2025-09-07 19:14:27',
  '2025-09-07 19:14:27'
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
  312,
  155,
  47,
  'credit',
  200.00,
  'Petty Cash Withdrawal: Rental submitted',
  10,
  1,
  '2025-09-07 19:14:27',
  '2025-09-07 19:14:27'
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
  313,
  156,
  47,
  'debit',
  17.00,
  'Petty Cash Addition: Petty Cash',
  10,
  1,
  '2025-09-07 19:14:46',
  '2025-09-07 19:14:46'
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
  314,
  156,
  48,
  'credit',
  17.00,
  'Petty Cash Addition from Cash',
  10,
  1,
  '2025-09-07 19:14:46',
  '2025-09-07 19:14:46'
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
  315,
  157,
  66,
  'debit',
  500.00,
  'Alamait management fee - Expense',
  10,
  1,
  '2025-09-07 19:21:49',
  '2025-09-07 19:21:49'
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
  316,
  157,
  48,
  'credit',
  500.00,
  'Alamait management fee - Payment',
  10,
  1,
  '2025-09-07 19:21:49',
  '2025-09-07 19:21:49'
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
  317,
  158,
  58,
  'debit',
  250.00,
  'water refill - Expense',
  10,
  1,
  '2025-10-02 07:03:43',
  '2025-10-02 07:03:43'
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
  318,
  158,
  47,
  'credit',
  250.00,
  'water refill - Payment',
  10,
  1,
  '2025-10-02 07:03:43',
  '2025-10-02 07:03:43'
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
  319,
  160,
  51,
  'debit',
  20.00,
  'Admin fee receivable - Student 44',
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  407,
  210,
  51,
  'debit',
  160.00,
  'Initial invoice - Debit Accounts Receivable',
  10,
  1,
  '2025-10-20 08:45:36',
  '2025-10-20 08:45:36'
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
  408,
  210,
  53,
  'credit',
  160.00,
  'Initial invoice - Credit Rentals Income',
  10,
  1,
  '2025-10-20 08:45:36',
  '2025-10-20 08:45:36'
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
  10,
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
  10,
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
  411,
  212,
  51,
  'debit',
  210.00,
  'Initial invoice - Debit Accounts Receivable',
  10,
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
  412,
  212,
  53,
  'credit',
  210.00,
  'Initial invoice - Credit Rentals Income',
  10,
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
  413,
  213,
  57,
  'debit',
  200.00,
  'Expenditure Request: Electricity',
  10,
  2,
  '2025-10-21 22:48:48',
  '2025-10-21 22:48:48'
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
  414,
  213,
  47,
  'credit',
  200.00,
  'Payment for: Electricity',
  10,
  2,
  '2025-10-21 22:48:48',
  '2025-10-21 22:48:48'
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
  415,
  214,
  64,
  'debit',
  500.00,
  'Expenditure Request: House through cleaning',
  10,
  2,
  '2025-10-21 22:56:04',
  '2025-10-21 22:56:04'
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
  416,
  214,
  47,
  'credit',
  500.00,
  'Payment for: House through cleaning',
  10,
  2,
  '2025-10-21 22:56:04',
  '2025-10-21 22:56:04'
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
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
  10,
  2,
  '2025-10-22 09:35:13',
  '2025-10-22 09:35:13'
);

-- Note: 399 journal entries had invalid boarding_house_id set to NULL
SET FOREIGN_KEY_CHECKS = 1;

-- Sync completed
-- Transactions synced: 201
-- Journal entries synced: 399
