CREATE DATABASE  IF NOT EXISTS `alamait_backup` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `alamait_backup`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: alamait_backup
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_balance_history`
--

DROP TABLE IF EXISTS `account_balance_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_balance_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `transaction_date` date NOT NULL,
  `opening_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `closing_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_debits` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_credits` decimal(15,2) NOT NULL DEFAULT '0.00',
  `transaction_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_account_date` (`account_id`,`transaction_date`),
  KEY `idx_transaction_date` (`transaction_date`),
  CONSTRAINT `account_balance_history_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_balance_history`
--

LOCK TABLES `account_balance_history` WRITE;
/*!40000 ALTER TABLE `account_balance_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_balance_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `account_ledger_with_bd_cd`
--

DROP TABLE IF EXISTS `account_ledger_with_bd_cd`;
/*!50001 DROP VIEW IF EXISTS `account_ledger_with_bd_cd`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `account_ledger_with_bd_cd` AS SELECT 
 1 AS `account_id`,
 1 AS `account_code`,
 1 AS `account_name`,
 1 AS `account_type`,
 1 AS `period_name`,
 1 AS `period_start_date`,
 1 AS `period_end_date`,
 1 AS `balance_brought_down`,
 1 AS `transaction_date`,
 1 AS `reference`,
 1 AS `description`,
 1 AS `entry_type`,
 1 AS `amount`,
 1 AS `debit_amount`,
 1 AS `credit_amount`,
 1 AS `running_balance`,
 1 AS `balance_carried_down`,
 1 AS `transaction_id`,
 1 AS `journal_entry_id`,
 1 AS `period_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `account_migration_mapping`
--

DROP TABLE IF EXISTS `account_migration_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_migration_mapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `old_account_id` int NOT NULL,
  `old_branch_id` int NOT NULL,
  `new_account_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `new_account_id` (`new_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_migration_mapping`
--

LOCK TABLES `account_migration_mapping` WRITE;
/*!40000 ALTER TABLE `account_migration_mapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_migration_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_period_balances`
--

DROP TABLE IF EXISTS `account_period_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_period_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `period_id` int NOT NULL,
  `balance_brought_down` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance_carried_down` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_debits` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_credits` decimal(15,2) NOT NULL DEFAULT '0.00',
  `transaction_count` int NOT NULL DEFAULT '0',
  `is_verified` tinyint(1) DEFAULT '0',
  `verified_by` int DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_account_period` (`account_id`,`period_id`),
  KEY `verified_by` (`verified_by`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_period_id` (`period_id`),
  CONSTRAINT `account_period_balances_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `account_period_balances_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `balance_periods` (`id`),
  CONSTRAINT `account_period_balances_ibfk_3` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=513 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_period_balances`
--

LOCK TABLES `account_period_balances` WRITE;
/*!40000 ALTER TABLE `account_period_balances` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_period_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_reconciliations`
--

DROP TABLE IF EXISTS `account_reconciliations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_reconciliations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `reconciliation_date` date NOT NULL,
  `book_balance` decimal(15,2) NOT NULL,
  `bank_balance` decimal(15,2) NOT NULL,
  `difference` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','reconciled','unreconciled') DEFAULT 'pending',
  `notes` text,
  `reconciled_by` int DEFAULT NULL,
  `reconciled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_account_date` (`account_id`,`reconciliation_date`),
  KEY `reconciled_by` (`reconciled_by`),
  CONSTRAINT `account_reconciliations_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `account_reconciliations_ibfk_2` FOREIGN KEY (`reconciled_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_reconciliations`
--

LOCK TABLES `account_reconciliations` WRITE;
/*!40000 ALTER TABLE `account_reconciliations` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_reconciliations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `entity` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `changes` text,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ba_payments`
--

DROP TABLE IF EXISTS `ba_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ba_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `description` text,
  `reference_number` varchar(100) DEFAULT NULL,
  `receipt_path` varchar(500) DEFAULT NULL,
  `status` enum('pending','completed','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text,
  `boarding_house_id` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `approved_by` (`approved_by`),
  KEY `rejected_by` (`rejected_by`),
  KEY `idx_status` (`status`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_boarding_house_id` (`boarding_house_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `ba_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ba_payments_ibfk_2` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ba_payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ba_payments_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ba_payments_ibfk_5` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ba_payments`
--

LOCK TABLES `ba_payments` WRITE;
/*!40000 ALTER TABLE `ba_payments` DISABLE KEYS */;
INSERT INTO `ba_payments` VALUES (21,178,160.00,'cash','2025-10-02','Payment from Agape Chiware','PAY-1763028473237',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:07:53','2025-11-13 10:07:53'),(22,151,180.00,'cash','2025-10-02','Payment from Alicia Mutamuko','PAY-1763028505706',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:08:25','2025-11-13 10:08:25'),(23,137,100.00,'cash','2025-10-02','Payment from Anita Gwenda','PAY-1763028534306',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:08:54','2025-11-13 10:08:54'),(24,140,180.00,'cash','2025-10-02','Payment from Bellis Mapetere','PAY-1763028896009',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:14:56','2025-11-13 10:14:56'),(25,153,190.00,'cash','2025-10-06','Payment from Bertha Majoni','PAY-1763028920954',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:15:20','2025-11-13 10:15:20'),(26,144,160.00,'cash','2025-10-13','Payment from Bertha Mwangu','PAY-1763028939784',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:15:39','2025-11-13 10:15:39'),(27,169,160.00,'cash','2025-10-13','Payment from Chantelle Gora','PAY-1763028984867',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:16:24','2025-11-13 10:16:24'),(28,169,35.00,'cash','2025-10-13','Payment from Chantelle Gora','PAY-1763029000955',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:16:40','2025-11-13 10:16:40'),(29,143,160.00,'cash','2025-10-06','Payment from Christine Mutsikwa','PAY-1763029102709',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:18:22','2025-11-13 10:18:22'),(30,186,160.00,'cash','2025-10-06','Payment from Dion sengamai','PAY-1763029125322',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:18:45','2025-11-13 10:18:45'),(31,187,160.00,'cash','2025-11-06','Payment from Emma Yoradin','PAY-1763029146658',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:19:06','2025-11-13 10:19:06'),(32,173,160.00,'cash','2025-10-01','Payment from Fadzai Mhizha','PAY-1763029163299',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:19:23','2025-11-13 10:19:23'),(33,184,120.00,'cash','2025-10-06','Payment from Farai Muzembe','PAY-1763029182751',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:19:42','2025-11-13 10:19:42'),(34,142,160.00,'cash','2025-10-03','Payment from Fay Mubaiwa','PAY-1763029200330',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:20:00','2025-11-13 10:20:00'),(35,160,320.00,'cash','2025-10-01','Payment from Kimbely Bones','PAY-1763029299158',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:21:39','2025-11-13 10:21:39'),(36,150,180.00,'cash','2025-10-10','Payment from Kimberly Mutowembwa','PAY-1763029313499',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:21:53','2025-11-13 10:21:53'),(37,149,160.00,'cash','2025-10-01','Payment from Kimberly Nkomo','PAY-1763029328937',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:22:08','2025-11-13 10:22:08'),(38,135,130.00,'cash','2025-10-02','Payment from Kudzai Matare','PAY-1763029349763',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:22:29','2025-11-13 10:22:29'),(39,135,50.00,'cash','2025-10-02','Payment from Kudzai Matare','PAY-1763029368783',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:22:48','2025-11-13 10:22:48'),(40,174,120.00,'cash','2025-10-02','Payment from Kuziwa ','PAY-1763029400994',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:23:20','2025-11-13 10:23:20'),(41,138,180.00,'cash','2025-10-02','Payment from Lillian Chatikobo','PAY-1763029473867',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:24:33','2025-11-13 10:24:33'),(42,154,170.00,'cash','2025-10-13','Payment from Lorraine Mlambo','PAY-1763029488397',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:24:48','2025-11-13 10:24:48'),(43,145,180.00,'cash','2025-10-06','Payment from Merrylin Makunzva','PAY-1763029506937',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:25:06','2025-11-13 10:25:06'),(44,175,160.00,'cash','2025-10-01','Payment from Mitchel Chikosha','PAY-1763029529221',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:25:29','2025-11-13 10:25:29'),(45,167,160.00,'cash','2025-10-02','Payment from Munashe ','PAY-1763029554630',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:25:54','2025-11-13 10:25:54'),(46,159,150.00,'cash','2025-10-02','Payment from Nyashadzashe Chinorwiwa','PAY-1763029574244',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:26:14','2025-11-13 10:26:14'),(47,183,190.00,'cash','2025-10-02','Payment from Pelagia Gomakalila','PAY-1763029598437',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:26:38','2025-11-13 10:26:38'),(48,165,190.00,'cash','2025-10-02','Payment from Precious Dziva','PAY-1763029613395',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:26:53','2025-11-13 10:26:53'),(49,157,160.00,'cash','2025-10-01','Payment from Precious Mashava','PAY-1763029626765',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:27:06','2025-11-13 10:27:06'),(50,188,120.00,'cash','2025-10-06','Payment from Ropafadzo Masara','PAY-1763029648684',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:27:28','2025-11-13 10:27:28'),(51,188,20.00,'cash','2025-10-06','Payment from Ropafadzo Masara','PAY-1763029663278',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:27:43','2025-11-13 10:27:43'),(52,156,150.00,'cash','2025-10-02','Payment from Rumbidzai Manyaora','PAY-1763029686125',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:28:06','2025-11-13 10:28:06'),(53,171,160.00,'cash','2025-10-06','Payment from Ruvimbo Singe','PAY-1763029742394',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:29:02','2025-11-13 10:29:02'),(54,147,170.00,'cash','2025-10-06','Payment from Salina Saidi','PAY-1763029761116',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:29:21','2025-11-13 10:29:21'),(55,170,160.00,'cash','2025-10-13','Payment from Shalom Gora','PAY-1763030016386',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:33:36','2025-11-13 10:33:36'),(56,170,35.00,'cash','2025-10-13','Payment from Shalom Gora','PAY-1763030028236',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:33:48','2025-11-13 10:33:48'),(57,136,180.00,'cash','2025-10-03','Payment from Shantel Mashe','PAY-1763030045949',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:34:05','2025-11-13 10:34:05'),(58,146,180.00,'cash','2025-10-03','Payment from Shantell Mawarira','PAY-1763030072804',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:34:32','2025-11-13 10:34:32'),(59,139,82.00,'cash','2025-10-02','Payment from Sharon Matanha','PAY-1763030100775',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:35:00','2025-11-13 10:35:00'),(60,162,160.00,'cash','2025-10-06','Payment from Tadiwa ','PAY-1763030253979',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:37:33','2025-11-13 10:37:33'),(61,163,200.00,'cash','2025-10-13','Payment from Tadiwa Mhloro','PAY-1763030275045',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:37:55','2025-11-13 10:37:55'),(62,134,200.00,'cash','2025-10-03','Payment from Takudzwa Makunde','PAY-1763030301140',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:38:21','2025-11-13 10:38:21'),(63,158,160.00,'cash','2025-10-01','Payment from Tanaka Chikonyera','PAY-1763030317813',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:38:37','2025-11-13 10:38:37'),(64,141,200.00,'cash','2025-10-03','Payment from Tatenda Kamatando','PAY-1763030367948',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:39:27','2025-11-13 10:39:27'),(65,172,60.00,'cash','2025-10-06','Payment from Thelma Nzvimari','PAY-1763030393325',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:39:53','2025-11-13 10:39:53'),(66,172,10.00,'cash','2025-10-06','Payment from Thelma Nzvimari','PAY-1763030404953',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:40:04','2025-11-13 10:40:04'),(67,148,170.00,'cash','2025-10-06','Payment from Tinotenda Bwangangwanyo','PAY-1763030425932',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:40:25','2025-11-13 10:40:25'),(68,185,140.00,'cash','2025-10-03','Payment from Tinotenda Chidavaenzi','PAY-1763030441299',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:40:41','2025-11-13 10:40:41'),(69,155,165.00,'cash','2025-10-16','Payment from Tinotenda Magiga','PAY-1763030464509',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:41:04','2025-11-13 10:41:04'),(70,132,100.00,'cash','2025-10-20','Payment from Trypheane Chinembiri','PAY-1763030480599',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:41:20','2025-11-13 10:41:20'),(71,177,125.00,'cash','2025-10-10','Payment from Vannessa Magorimbo','PAY-1763030494078',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:41:34','2025-11-13 10:41:34'),(72,177,30.00,'cash','2025-10-10','Payment from Vannessa Magorimbo','PAY-1763030507778',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:41:47','2025-11-13 10:41:47'),(73,176,160.00,'cash','2025-10-01','Payment from Vimbai ','PAY-1763030547310',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 10:42:27','2025-11-13 10:42:27'),(74,194,180.00,'cash','2025-10-03','Payment from Sharmaine Tinarwo','PAY-1763032944754',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 11:22:24','2025-11-13 11:22:24'),(75,193,220.00,'cash','2025-10-02','Payment from Tanaka Matematema','PAY-1763032963097',NULL,'pending',NULL,NULL,NULL,NULL,NULL,10,6,'2025-11-13 11:22:43','2025-11-13 11:22:43');
/*!40000 ALTER TABLE `ba_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `balance_periods`
--

DROP TABLE IF EXISTS `balance_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `balance_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `period_name` varchar(100) NOT NULL,
  `period_start_date` date NOT NULL,
  `period_end_date` date NOT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  `closed_at` timestamp NULL DEFAULT NULL,
  `closed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_period_dates` (`period_start_date`,`period_end_date`),
  KEY `closed_by` (`closed_by`),
  CONSTRAINT `balance_periods_ibfk_1` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `balance_periods`
--

LOCK TABLES `balance_periods` WRITE;
/*!40000 ALTER TABLE `balance_periods` DISABLE KEYS */;
/*!40000 ALTER TABLE `balance_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `balance_verifications`
--

DROP TABLE IF EXISTS `balance_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `balance_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_period_balance_id` int NOT NULL,
  `verified_by` int NOT NULL,
  `verification_date` date NOT NULL,
  `previous_balance` decimal(15,2) NOT NULL,
  `new_balance` decimal(15,2) NOT NULL,
  `adjustment_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `adjustment_reason` text,
  `verification_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `account_period_balance_id` (`account_period_balance_id`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `balance_verifications_ibfk_1` FOREIGN KEY (`account_period_balance_id`) REFERENCES `account_period_balances` (`id`),
  CONSTRAINT `balance_verifications_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `balance_verifications`
--

LOCK TABLES `balance_verifications` WRITE;
/*!40000 ALTER TABLE `balance_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `balance_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `beds`
--

DROP TABLE IF EXISTS `beds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `bed_number` varchar(50) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `status` enum('available','occupied','maintenance','reserved') DEFAULT 'available',
  `student_id` int DEFAULT NULL,
  `enrollment_id` int DEFAULT NULL,
  `notes` text,
  `bed_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bed_per_room` (`room_id`,`bed_number`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `idx_beds_room_status` (`room_id`,`status`),
  KEY `idx_beds_student` (`student_id`),
  KEY `idx_beds_image` (`bed_image`),
  CONSTRAINT `beds_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `beds_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `beds_ibfk_3` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beds`
--

LOCK TABLES `beds` WRITE;
/*!40000 ALTER TABLE `beds` DISABLE KEYS */;
INSERT INTO `beds` VALUES (162,45,'BED1',160.00,'occupied',178,61,'',NULL,'2025-11-10 19:45:55','2025-11-10 20:54:05',NULL),(163,45,'BED2',160.00,'occupied',143,68,'',NULL,'2025-11-10 19:45:55','2025-11-10 21:08:04',NULL),(164,45,'BED3',160.00,'occupied',187,70,'',NULL,'2025-11-10 19:45:55','2025-11-10 21:09:56',NULL),(165,45,'BED4',160.00,'occupied',179,88,'',NULL,'2025-11-10 19:45:55','2025-11-10 21:29:30',NULL),(166,45,'BED5',160.00,'occupied',158,105,'',NULL,'2025-11-10 19:45:55','2025-11-10 21:53:07',NULL),(167,45,'BED6',160.00,'occupied',177,113,'',NULL,'2025-11-10 19:45:55','2025-11-10 21:59:08',NULL),(168,46,'BED1',160.00,'occupied',144,66,'',NULL,'2025-11-10 19:47:00','2025-11-10 21:04:51',NULL),(169,46,'BED2',160.00,'occupied',173,71,'',NULL,'2025-11-10 19:47:00','2025-11-10 21:10:33',NULL),(170,46,'BED3',160.00,'occupied',160,75,'',NULL,'2025-11-10 19:47:00','2025-11-10 21:15:35',NULL),(171,46,'BED4',160.00,'occupied',162,102,'',NULL,'2025-11-10 19:47:00','2025-11-10 21:50:39',NULL),(172,46,'BED5',160.00,'occupied',185,110,'',NULL,'2025-11-10 19:47:00','2025-11-10 21:56:40',NULL),(173,47,'BED1',190.00,'occupied',183,89,'',NULL,'2025-11-10 19:47:34','2025-11-10 21:30:11',NULL),(174,47,'BED2',190.00,'occupied',168,97,'',NULL,'2025-11-10 19:47:34','2025-11-10 21:44:18',NULL),(175,48,'BED1',190.00,'occupied',165,90,'',NULL,'2025-11-10 19:48:06','2025-11-10 21:31:57',NULL),(176,48,'BED2',190.00,'occupied',134,104,'',NULL,'2025-11-10 19:48:06','2025-11-10 21:52:06',NULL),(177,49,'BED1',220.00,'occupied',189,79,'',NULL,'2025-11-10 19:50:34','2025-11-10 21:18:26',NULL),(178,50,'BED1',160.00,'occupied',169,67,'',NULL,'2025-11-10 19:52:37','2025-11-10 21:05:25',NULL),(179,50,'BED2',160.00,'occupied',186,69,'',NULL,'2025-11-10 19:52:37','2025-11-10 21:09:10',NULL),(180,50,'BED3',160.00,'occupied',167,85,'',NULL,'2025-11-10 19:52:37','2025-11-10 21:27:13',NULL),(181,50,'BED4',160.00,'occupied',170,98,'',NULL,'2025-11-10 19:52:37','2025-11-10 21:47:03',NULL),(182,50,'BED5',160.00,'occupied',141,106,'',NULL,'2025-11-10 19:52:37','2025-11-10 21:53:48',NULL),(183,50,'BED6',160.00,'occupied',194,120,'',NULL,'2025-11-10 19:52:37','2025-11-13 11:21:51',NULL),(184,51,'BED1',160.00,'occupied',137,63,'',NULL,'2025-11-10 19:53:41','2025-11-10 21:01:10',NULL),(185,51,'BED2',160.00,'occupied',181,73,'',NULL,'2025-11-10 19:53:41','2025-11-10 21:12:52',NULL),(186,51,'BED3',160.00,'occupied',180,74,'',NULL,'2025-11-10 19:53:41','2025-11-10 21:13:50',NULL),(187,51,'BED4',160.00,'occupied',172,108,'',NULL,'2025-11-10 19:53:41','2025-11-10 21:54:57',NULL),(188,51,'BED5',160.00,'occupied',184,115,'',NULL,'2025-11-10 19:53:41','2025-11-11 12:35:32',NULL),(189,52,'BED1',180.00,'occupied',140,64,'',NULL,'2025-11-10 19:55:00','2025-11-10 21:03:39',NULL),(190,52,'BED2',180.00,'occupied',161,86,'',NULL,'2025-11-10 19:55:00','2025-11-10 21:28:03',NULL),(191,52,'BED3',180.00,'occupied',163,103,'',NULL,'2025-11-10 19:55:00','2025-11-10 21:51:27',NULL),(192,53,'BED1',170.00,'occupied',154,82,'',NULL,'2025-11-10 19:55:40','2025-11-10 21:24:23',NULL),(193,53,'BED2',170.00,'occupied',147,96,'',NULL,'2025-11-10 19:55:40','2025-11-10 21:43:16',NULL),(194,53,'BED3',170.00,'occupied',148,109,'',NULL,'2025-11-10 19:55:40','2025-11-10 21:55:41',NULL),(195,53,'BED4',170.00,'occupied',155,111,'',NULL,'2025-11-10 19:55:40','2025-11-10 21:57:30',NULL),(196,54,'BED1',180.00,'occupied',182,92,'',NULL,'2025-11-10 19:56:26','2025-11-10 21:37:08',NULL),(197,54,'BED2',180.00,'occupied',171,95,'',NULL,'2025-11-10 19:56:26','2025-11-10 21:42:29',NULL),(198,54,'BED3',180.00,'available',NULL,NULL,'',NULL,'2025-11-10 19:56:26','2025-11-13 11:06:00',NULL),(199,55,'BED1',180.00,'occupied',150,76,'',NULL,'2025-11-10 19:57:40','2025-11-10 21:16:18',NULL),(200,55,'BED2',180.00,'occupied',138,81,'',NULL,'2025-11-10 19:57:40','2025-11-10 21:23:41',NULL),(201,55,'BED3',180.00,'occupied',139,101,'',NULL,'2025-11-10 19:57:40','2025-11-10 21:49:30',NULL),(202,56,'BED1',180.00,'occupied',145,83,'',NULL,'2025-11-10 19:58:49','2025-11-10 21:25:35',NULL),(203,56,'BED2',180.00,'occupied',146,100,'',NULL,'2025-11-10 19:58:49','2025-11-10 21:48:49',NULL),(204,56,'BED3',180.00,'occupied',132,112,'',NULL,'2025-11-10 19:58:49','2025-11-11 13:51:54',NULL),(205,57,'BED1',180.00,'occupied',151,62,'',NULL,'2025-11-10 19:59:42','2025-11-10 21:00:21',NULL),(206,57,'BED2',180.00,'occupied',153,65,'',NULL,'2025-11-10 19:59:42','2025-11-10 21:04:12',NULL),(207,57,'BED3',180.00,'occupied',193,119,'',NULL,'2025-11-10 19:59:42','2025-11-13 11:14:05',NULL),(208,58,'BED1',180.00,'occupied',135,78,'',NULL,'2025-11-10 20:00:40','2025-11-10 21:17:50',NULL),(209,58,'BED2',180.00,'occupied',136,99,'',NULL,'2025-11-10 20:00:40','2025-11-10 21:48:12',NULL),(210,58,'BED3',180.00,'occupied',152,107,'',NULL,'2025-11-10 20:00:40','2025-11-10 21:54:24',NULL),(211,59,'BED1',160.00,'occupied',142,72,'',NULL,'2025-11-10 20:02:45','2025-11-10 21:11:13',NULL),(212,59,'BED2',160.00,'occupied',149,77,'',NULL,'2025-11-10 20:02:45','2025-11-10 21:17:02',NULL),(213,59,'BED3',160.00,'occupied',175,84,'',NULL,'2025-11-10 20:02:45','2025-11-10 21:26:27',NULL),(214,59,'BED4',160.00,'occupied',157,91,'',NULL,'2025-11-10 20:02:45','2025-11-10 21:32:46',NULL),(215,59,'BED5',160.00,'occupied',188,93,'',NULL,'2025-11-10 20:02:45','2025-11-10 21:37:58',NULL),(216,59,'BED6',160.00,'occupied',176,114,'',NULL,'2025-11-10 20:02:45','2025-11-10 21:59:57',NULL),(217,60,'BED1',150.00,'occupied',159,87,'',NULL,'2025-11-10 20:03:11','2025-11-11 14:05:53',NULL),(218,61,'BED1',120.00,'occupied',174,80,'',NULL,'2025-11-10 20:03:43','2025-11-11 14:07:39',NULL),(219,61,'BED2',120.00,'available',NULL,NULL,'',NULL,'2025-11-10 20:03:43','2025-11-11 14:07:47',NULL),(220,60,'BED2',150.00,'occupied',156,94,'',NULL,'2025-11-10 21:40:40','2025-11-11 14:05:59',NULL);
/*!40000 ALTER TABLE `beds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boarding_house_admins`
--

DROP TABLE IF EXISTS `boarding_house_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boarding_house_admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boarding_house_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boarding_house_admins`
--

LOCK TABLES `boarding_house_admins` WRITE;
/*!40000 ALTER TABLE `boarding_house_admins` DISABLE KEYS */;
INSERT INTO `boarding_house_admins` VALUES (12,10,6,'2025-11-10 19:29:54','2025-11-10 19:29:54',NULL);
/*!40000 ALTER TABLE `boarding_house_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boarding_houses`
--

DROP TABLE IF EXISTS `boarding_houses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boarding_houses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` text NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boarding_houses`
--

LOCK TABLES `boarding_houses` WRITE;
/*!40000 ALTER TABLE `boarding_houses` DISABLE KEYS */;
INSERT INTO `boarding_houses` VALUES (10,'St Kilda','Mount Pleasant',1,'2025-11-10 19:29:54','2025-11-10 19:29:54',NULL);
/*!40000 ALTER TABLE `boarding_houses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_categories`
--

DROP TABLE IF EXISTS `budget_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `budget_request_id` int NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_budget_request_id` (`budget_request_id`),
  CONSTRAINT `budget_categories_ibfk_1` FOREIGN KEY (`budget_request_id`) REFERENCES `budget_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_categories`
--

LOCK TABLES `budget_categories` WRITE;
/*!40000 ALTER TABLE `budget_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_requests`
--

DROP TABLE IF EXISTS `budget_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boarding_house_id` int NOT NULL,
  `month` varchar(20) NOT NULL,
  `year` int NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `description` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `submitted_by` int NOT NULL,
  `submitted_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_date` timestamp NULL DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejected_date` timestamp NULL DEFAULT NULL,
  `rejection_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `approved_by` (`approved_by`),
  KEY `rejected_by` (`rejected_by`),
  KEY `idx_month_year` (`month`,`year`),
  KEY `idx_status` (`status`),
  KEY `idx_submitted_by` (`submitted_by`),
  KEY `idx_boarding_house_id` (`boarding_house_id`),
  CONSTRAINT `budget_requests_ibfk_1` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_requests_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `budget_requests_ibfk_4` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_requests`
--

LOCK TABLES `budget_requests` WRITE;
/*!40000 ALTER TABLE `budget_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chart_of_accounts`
--

DROP TABLE IF EXISTS `chart_of_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chart_of_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
  `is_category` tinyint(1) DEFAULT '0',
  `parent_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`,`deleted_at`),
  UNIQUE KEY `unique_name_under_parent` (`name`,`parent_id`,`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chart_of_accounts`
--

LOCK TABLES `chart_of_accounts` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts` DISABLE KEYS */;
INSERT INTO `chart_of_accounts` VALUES (47,'10001','Petty Cash','Asset',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(48,'10002','Cash','Asset',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(49,'10003','CBZ Bank Account','Asset',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(50,'10004','CBZ Vault','Asset',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(51,'10005','Accounts Receivable','Asset',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(52,'20001','Accounts Payable','Liability',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(53,'40001','Rentals Income','Revenue',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(54,'40002','Other Income','Revenue',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(55,'50001','Repairs and Maintenance','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(56,'50002','Utilities - Water','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(57,'50003','Utilities - Electricity','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(58,'50004','Bulk Water','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(59,'50005','Car Running','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(60,'50006','Car Maintenance and Repair','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(61,'50007','Gas Filling','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(62,'50008','Communication Cost','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(63,'50009','Sanitary','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(64,'50010','House Keeping','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(65,'50011','Security Costs','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(66,'50012','Property Management ','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-11-18 12:58:03',NULL),(67,'50013','Administrative Expenses','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(68,'50014','Marketing Expenses','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(69,'50015','Staff Salaries & Wages','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(70,'50016','Staff Welfare','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(71,'50017','Depreciation - Buildings','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(72,'50018','Professional Fees (Legal, Audit)','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(73,'50019','Waste Management','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(74,'50020','Medical Aid','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(75,'50021','Advertising','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(76,'50022','Family Expenses','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(77,'50023','House Association Fees','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(78,'50024','Licenses','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(79,'50025','Depreciation - Motor Vehicles','Expense',0,NULL,1,'2025-08-24 16:16:15','2025-08-24 16:16:15',NULL),(80,'50026','Utilities - wifi','Expense',0,NULL,1,'2025-09-01 20:37:02','2025-09-01 20:37:02',NULL),(81,'30004','Opening Balance Equity','Equity',0,NULL,1,'2025-09-01 21:54:32','2025-09-01 21:54:32',NULL),(82,'500027','City Council Rates','Expense',0,NULL,1,'2025-10-14 09:38:20','2025-10-14 09:38:20',NULL),(83,'50027','Rental expense','Expense',0,NULL,6,'2025-11-18 12:47:06','2025-11-18 12:47:06',NULL),(84,'50028','Bank charges','Expense',0,NULL,6,'2025-11-18 13:07:00','2025-11-18 13:07:00',NULL);
/*!40000 ALTER TABLE `chart_of_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chart_of_accounts_branch`
--

DROP TABLE IF EXISTS `chart_of_accounts_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chart_of_accounts_branch` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
  `is_category` tinyint(1) DEFAULT '0',
  `parent_id` int DEFAULT NULL,
  `created_by` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code_branch` (`code`,`branch_id`,`deleted_at`),
  UNIQUE KEY `unique_name_under_parent_branch` (`name`,`parent_id`,`branch_id`,`deleted_at`),
  KEY `parent_id` (`parent_id`),
  KEY `created_by` (`created_by`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `chart_of_accounts_branch_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts_branch` (`id`),
  CONSTRAINT `chart_of_accounts_branch_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chart_of_accounts_branch_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `boarding_houses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=188 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chart_of_accounts_branch`
--

LOCK TABLES `chart_of_accounts_branch` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts_branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `chart_of_accounts_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `code` varchar(10) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `symbol` varchar(10) DEFAULT NULL,
  `is_base` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `current_account_balances`
--

DROP TABLE IF EXISTS `current_account_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `current_account_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `account_code` varchar(20) NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `account_type` enum('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
  `current_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_debits` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_credits` decimal(15,2) NOT NULL DEFAULT '0.00',
  `transaction_count` int NOT NULL DEFAULT '0',
  `last_transaction_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_account` (`account_id`),
  KEY `idx_account_code` (`account_code`),
  KEY `idx_account_type` (`account_type`),
  CONSTRAINT `current_account_balances_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `current_account_balances`
--

LOCK TABLES `current_account_balances` WRITE;
/*!40000 ALTER TABLE `current_account_balances` DISABLE KEYS */;
INSERT INTO `current_account_balances` VALUES (1,47,'10001','Petty Cash','Asset',71.08,9815.08,9744.00,85,'2025-11-13','2025-11-18 12:53:45','2025-11-18 12:53:45'),(2,48,'10002','Cash','Asset',3353.55,10340.55,6987.00,24,'2025-10-30','2025-11-18 12:53:45','2025-11-18 13:10:03'),(3,49,'10003','CBZ Bank Account','Asset',339.75,530.35,190.60,5,'2025-11-18','2025-11-18 12:53:45','2025-11-18 13:07:40'),(4,50,'10004','CBZ Vault','Asset',1780.00,1780.00,0.00,2,'2025-10-30','2025-11-18 12:53:45','2025-11-18 13:10:03'),(5,51,'10005','Accounts Receivable','Asset',-1588.00,10193.00,11781.00,151,'2025-10-20','2025-11-18 12:53:45','2025-11-18 12:53:45'),(6,52,'20001','Accounts Payable','Liability',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(7,53,'40001','Rentals Income','Revenue',6534.00,3659.00,10193.00,96,'2025-10-01','2025-11-18 12:53:45','2025-11-18 12:53:45'),(8,54,'40002','Other Income','Revenue',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(9,55,'50001','Repairs and Maintenance','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(10,56,'50002','Utilities - Water','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(11,57,'50003','Utilities - Electricity','Expense',280.00,280.00,0.00,3,'2025-10-16','2025-11-18 12:53:45','2025-11-18 12:53:45'),(12,58,'50004','Bulk Water','Expense',750.00,750.00,0.00,4,'2025-10-23','2025-11-18 12:53:45','2025-11-18 12:53:45'),(13,59,'50005','Car Running','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(14,60,'50006','Car Maintenance and Repair','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(15,61,'50007','Gas Filling','Expense',192.00,192.00,0.00,1,'2025-10-01','2025-11-18 12:53:45','2025-11-18 12:53:45'),(16,62,'50008','Communication Cost','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(17,63,'50009','Sanitary','Expense',100.00,100.00,0.00,2,'2025-10-18','2025-11-18 12:53:45','2025-11-18 12:53:45'),(18,64,'50010','House Keeping','Expense',40.00,40.00,0.00,1,'2025-10-01','2025-11-18 12:53:45','2025-11-18 12:53:45'),(19,65,'50011','Security Costs','Expense',585.00,585.00,0.00,2,'2025-11-18','2025-11-18 12:53:45','2025-11-18 13:05:55'),(20,66,'50012','Property Management Salaries','Expense',2415.00,2415.00,0.00,2,'2025-10-30','2025-11-18 12:53:45','2025-11-18 13:00:19'),(21,67,'50013','Administrative Expenses','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(22,68,'50014','Marketing Expenses','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(23,69,'50015','Staff Salaries & Wages','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(24,70,'50016','Staff Welfare','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(25,71,'50017','Depreciation - Buildings','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(26,72,'50018','Professional Fees (Legal, Audit)','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(27,73,'50019','Waste Management','Expense',30.00,30.00,0.00,1,'2025-10-16','2025-11-18 12:53:45','2025-11-18 12:53:45'),(28,74,'50020','Medical Aid','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(29,75,'50021','Advertising','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(30,76,'50022','Family Expenses','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(31,77,'50023','House Association Fees','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(32,78,'50024','Licenses','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(33,79,'50025','Depreciation - Motor Vehicles','Expense',0.00,0.00,0.00,0,NULL,'2025-11-18 12:53:45','2025-11-18 12:53:45'),(34,80,'50026','Utilities - wifi','Expense',130.00,130.00,0.00,2,'2025-10-16','2025-11-18 12:53:45','2025-11-18 12:53:45'),(35,81,'30004','Opening Balance Equity','Equity',4049.98,0.00,4049.98,6,'2025-09-30','2025-11-18 12:53:45','2025-11-18 12:53:45'),(36,82,'500027','City Council Rates','Expense',100.00,100.00,0.00,1,'2025-10-01','2025-11-18 12:53:45','2025-11-18 12:53:45'),(37,83,'50027','Rental expense','Expense',2000.00,2000.00,0.00,1,'2025-10-30','2025-11-18 12:53:45','2025-11-18 12:53:45'),(67,84,'50028','Bank charges','Expense',5.60,5.60,0.00,1,'2025-11-18','2025-11-18 13:07:40','2025-11-18 13:07:40');
/*!40000 ALTER TABLE `current_account_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `current_period_balances`
--

DROP TABLE IF EXISTS `current_period_balances`;
/*!50001 DROP VIEW IF EXISTS `current_period_balances`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_period_balances` AS SELECT 
 1 AS `account_id`,
 1 AS `account_code`,
 1 AS `account_name`,
 1 AS `account_type`,
 1 AS `period_id`,
 1 AS `period_name`,
 1 AS `period_start_date`,
 1 AS `period_end_date`,
 1 AS `balance_brought_down`,
 1 AS `balance_carried_down`,
 1 AS `total_debits`,
 1 AS `total_credits`,
 1 AS `transaction_count`,
 1 AS `is_verified`,
 1 AS `calculated_balance`,
 1 AS `current_balance`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `exchange_rates`
--

DROP TABLE IF EXISTS `exchange_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `base_currency` varchar(10) DEFAULT NULL,
  `target_currency` varchar(10) DEFAULT NULL,
  `rate` decimal(18,8) DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rates`
--

LOCK TABLES `exchange_rates` WRITE;
/*!40000 ALTER TABLE `exchange_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenditure_attachments`
--

DROP TABLE IF EXISTS `expenditure_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenditure_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expenditure_request_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_expenditure_request_id` (`expenditure_request_id`),
  CONSTRAINT `expenditure_attachments_ibfk_1` FOREIGN KEY (`expenditure_request_id`) REFERENCES `expenditure_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenditure_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenditure_attachments`
--

LOCK TABLES `expenditure_attachments` WRITE;
/*!40000 ALTER TABLE `expenditure_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenditure_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenditure_requests`
--

DROP TABLE IF EXISTS `expenditure_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenditure_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boarding_house_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(15,2) NOT NULL,
  `category` varchar(100) NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `expected_date` date DEFAULT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `justification` text NOT NULL,
  `status` enum('pending','approved','rejected','actioned') DEFAULT 'pending',
  `submitted_by` int NOT NULL,
  `submitted_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_date` timestamp NULL DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejected_date` timestamp NULL DEFAULT NULL,
  `rejection_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `approved_by` (`approved_by`),
  KEY `rejected_by` (`rejected_by`),
  KEY `idx_status` (`status`),
  KEY `idx_submitted_by` (`submitted_by`),
  KEY `idx_category` (`category`),
  KEY `idx_priority` (`priority`),
  KEY `idx_boarding_house_id` (`boarding_house_id`),
  CONSTRAINT `expenditure_requests_ibfk_1` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenditure_requests_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenditure_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenditure_requests_ibfk_4` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenditure_requests`
--

LOCK TABLES `expenditure_requests` WRITE;
/*!40000 ALTER TABLE `expenditure_requests` DISABLE KEYS */;
INSERT INTO `expenditure_requests` VALUES (13,10,'Water','water',250.00,'Bulk Water','high','2025-10-01','','','actioned',6,'2025-11-18 10:06:28',6,'2025-11-18 10:06:38',NULL,NULL,NULL,'2025-11-18 10:06:28','2025-11-18 10:06:48'),(14,10,'Gas','gas',192.00,'Gas Filling','high','2025-10-01','','','actioned',6,'2025-11-18 10:08:31',6,'2025-11-18 10:08:44',NULL,NULL,NULL,'2025-11-18 10:08:31','2025-11-18 10:08:57'),(15,10,'Solar service','solar service',40.00,'Utilities - Electricity','urgent','2025-10-01','','','actioned',6,'2025-11-18 10:11:21',6,'2025-11-18 10:11:32',NULL,NULL,NULL,'2025-11-18 10:11:21','2025-11-18 10:11:44'),(16,10,'firewood','firewood',40.00,'House Keeping','medium','2025-10-01','','','actioned',6,'2025-11-18 10:14:17',6,'2025-11-18 10:14:37',NULL,NULL,NULL,'2025-11-18 10:14:17','2025-11-18 10:14:44'),(17,10,'Security','security',400.00,'Bulk Water','medium','2025-10-10','','','actioned',6,'2025-11-18 10:24:00',6,'2025-11-18 10:24:07',NULL,NULL,NULL,'2025-11-18 10:24:00','2025-11-18 10:24:20'),(18,10,'Water','water',250.00,'Bulk Water','medium','2025-10-11','','','actioned',6,'2025-11-18 12:12:31',6,'2025-11-18 12:12:45',NULL,NULL,NULL,'2025-11-18 12:12:31','2025-11-18 12:13:11'),(19,10,'Sanitary','sanitary',90.00,'Sanitary','medium','2025-10-10','','','actioned',6,'2025-11-18 12:16:18',6,'2025-11-18 12:16:24',NULL,NULL,NULL,'2025-11-18 12:16:18','2025-11-18 12:16:36'),(20,10,'water','bulk water',150.00,'Bulk Water','medium','2025-10-16','','','actioned',6,'2025-11-18 12:19:08',6,'2025-11-18 12:19:15',NULL,NULL,NULL,'2025-11-18 12:19:08','2025-11-18 12:19:25'),(21,10,'firewood','',40.00,'Utilities - Electricity','medium','2025-10-16','','','actioned',6,'2025-11-18 12:20:38',6,'2025-11-18 12:20:52',NULL,NULL,NULL,'2025-11-18 12:20:38','2025-11-18 12:20:59'),(22,10,'Wifi fixing misc','wifi fixing misc',30.00,'Utilities - wifi','medium','2025-10-16','','','actioned',6,'2025-11-18 12:22:11',6,'2025-11-18 12:22:17',NULL,NULL,NULL,'2025-11-18 12:22:11','2025-11-18 12:22:22'),(23,10,'Cleaning supplies','cleaning supplies',10.00,'Sanitary','medium','2025-10-18','','','actioned',6,'2025-11-18 12:23:35',6,'2025-11-18 12:23:40',NULL,NULL,NULL,'2025-11-18 12:23:35','2025-11-18 12:23:44'),(24,10,'Garbage collection','garbage collection',30.00,'Waste Management','medium','2025-10-16','','','actioned',6,'2025-11-18 12:24:57',6,'2025-11-18 12:25:09',NULL,NULL,NULL,'2025-11-18 12:24:57','2025-11-18 12:25:19'),(25,10,'water','',100.00,'Bulk Water','medium','2025-10-23','','','actioned',6,'2025-11-18 12:28:51',6,'2025-11-18 12:29:00',NULL,NULL,NULL,'2025-11-18 12:28:51','2025-11-18 12:29:05');
/*!40000 ALTER TABLE `expenditure_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `payment_method` enum('cash','bank_transfer','check','petty_cash','credit') NOT NULL,
  `payment_status` enum('full','partial','debt') DEFAULT 'full',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `remaining_balance` decimal(10,2) DEFAULT NULL,
  `remaining_payment_method` enum('cash','bank_transfer','check','petty_cash','credit') DEFAULT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `expense_account_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `notes` text,
  `created_by` int NOT NULL DEFAULT '1',
  `boarding_house_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `receipt_path` varchar(255) DEFAULT NULL,
  `receipt_original_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `expense_account_id` (`expense_account_id`),
  KEY `created_by` (`created_by`),
  KEY `boarding_house_id` (`boarding_house_id`),
  KEY `idx_expenses_payment_status` (`payment_status`),
  KEY `idx_expenses_payment_method` (`payment_method`),
  KEY `idx_expenses_supplier_id` (`supplier_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`expense_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`),
  CONSTRAINT `expenses_ibfk_5` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (21,574,'2025-10-01',250.00,'water','cash','full',250.00,0.00,NULL,'EXP-REQ-13',58,NULL,'',6,10,'2025-11-18 10:06:48','2025-11-18 10:06:48',NULL,NULL,NULL),(22,575,'2025-10-01',192.00,'gas','cash','full',192.00,0.00,NULL,'EXP-REQ-14',61,NULL,'',6,10,'2025-11-18 10:08:57','2025-11-18 10:08:57',NULL,NULL,NULL),(23,576,'2025-10-01',40.00,'solar service','cash','full',40.00,0.00,NULL,'EXP-REQ-15',57,NULL,'',6,10,'2025-11-18 10:11:44','2025-11-18 10:11:44',NULL,NULL,NULL),(24,577,'2025-10-01',40.00,'firewood','cash','full',40.00,0.00,NULL,'EXP-REQ-16',64,NULL,'',6,10,'2025-11-18 10:14:44','2025-11-18 10:14:44',NULL,NULL,NULL),(25,582,'2025-10-10',400.00,'Expenditure Request: Security','cash','full',400.00,0.00,NULL,'EXP-REQ-17',65,NULL,'',6,10,'2025-11-18 10:24:20','2025-11-18 10:25:29',NULL,NULL,NULL),(26,583,'2025-10-11',250.00,'water','cash','full',250.00,0.00,NULL,'EXP-REQ-18',58,NULL,'',6,10,'2025-11-18 12:13:11','2025-11-18 12:13:11',NULL,NULL,NULL),(27,586,'2025-10-10',90.00,'sanitary','cash','full',90.00,0.00,NULL,'EXP-REQ-19',63,NULL,'',6,10,'2025-11-18 12:16:36','2025-11-18 12:16:36',NULL,NULL,NULL),(28,589,'2025-10-16',150.00,'bulk water','cash','full',150.00,0.00,NULL,'EXP-REQ-20',58,NULL,'',6,10,'2025-11-18 12:19:25','2025-11-18 12:19:25',NULL,NULL,NULL),(29,590,'2025-10-16',40.00,'firewood','cash','full',40.00,0.00,NULL,'EXP-REQ-21',57,NULL,'',6,10,'2025-11-18 12:20:59','2025-11-18 12:20:59',NULL,NULL,NULL),(30,591,'2025-10-16',30.00,'wifi fixing misc','cash','full',30.00,0.00,NULL,'EXP-REQ-22',80,NULL,'',6,10,'2025-11-18 12:22:22','2025-11-18 12:22:22',NULL,NULL,NULL),(31,592,'2025-10-18',10.00,'cleaning supplies','cash','full',10.00,0.00,NULL,'EXP-REQ-23',63,NULL,'',6,10,'2025-11-18 12:23:44','2025-11-18 12:23:44',NULL,NULL,NULL),(32,593,'2025-10-16',30.00,'garbage collection','cash','full',30.00,0.00,NULL,'EXP-REQ-24',73,NULL,'',6,10,'2025-11-18 12:25:19','2025-11-18 12:25:19',NULL,NULL,NULL),(33,597,'2025-10-23',100.00,'water','cash','full',100.00,0.00,NULL,'EXP-REQ-25',58,NULL,'',6,10,'2025-11-18 12:29:05','2025-11-18 12:29:05',NULL,NULL,NULL),(34,602,'2025-10-01',200.00,'water expenses','cash','full',200.00,0.00,NULL,'EXP-20251118-143557',57,NULL,NULL,1,10,'2025-11-18 12:36:41','2025-11-18 12:36:41',NULL,NULL,NULL),(35,603,'2025-10-01',100.00,'city council rates','cash','full',100.00,0.00,NULL,'EXP-20251118-143704',82,NULL,NULL,1,10,'2025-11-18 12:37:31','2025-11-18 12:37:31',NULL,NULL,NULL),(36,604,'2025-10-01',100.00,'wifi','cash','full',100.00,0.00,NULL,'EXP-20251118-143752',80,NULL,NULL,1,10,'2025-11-18 12:38:20','2025-11-18 12:38:20',NULL,NULL,NULL),(37,605,'2025-10-29',1300.00,'ALAMAIT MANAGEMENT FEE','cash','full',1300.00,0.00,NULL,'EXP-20251118-144353',66,NULL,NULL,1,10,'2025-11-18 12:45:06','2025-11-18 12:45:06',NULL,NULL,NULL),(38,606,'2025-10-30',2000.00,'payment rental meadow and willow','cash','full',2000.00,0.00,NULL,'EXP-20251118-144722',83,NULL,NULL,1,10,'2025-11-18 12:48:41','2025-11-18 12:48:41',NULL,NULL,NULL),(39,607,'2025-10-30',1115.00,'alamait management fee','bank_transfer','full',1115.00,0.00,NULL,'EXP-20251118-145849',66,NULL,NULL,1,10,'2025-11-18 12:59:19','2025-11-18 13:00:19',NULL,NULL,NULL),(40,608,'2025-10-14',185.00,'rapid response','bank_transfer','full',185.00,0.00,NULL,'EXP-20251118-150536',65,NULL,NULL,1,10,'2025-11-18 13:05:55','2025-11-18 13:05:55',NULL,NULL,NULL),(41,609,'2025-10-14',5.60,'Bank charges','bank_transfer','full',5.60,0.00,NULL,'EXP-20251118-150716',84,NULL,NULL,1,10,'2025-11-18 13:07:40','2025-11-18 13:07:40',NULL,NULL,NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_entries`
--

DROP TABLE IF EXISTS `journal_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `account_id` int NOT NULL,
  `entry_type` enum('debit','credit') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` text,
  `boarding_house_id` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `account_id` (`account_id`),
  KEY `boarding_house_id` (`boarding_house_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`),
  CONSTRAINT `journal_entries_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `journal_entries_ibfk_3` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`),
  CONSTRAINT `journal_entries_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1225 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_entries`
--

LOCK TABLES `journal_entries` WRITE;
/*!40000 ALTER TABLE `journal_entries` DISABLE KEYS */;
INSERT INTO `journal_entries` VALUES (813,415,51,'credit',160.00,'Previous balance (credit) - Credit Accounts Receivable - Anita Gwenda',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(814,415,53,'debit',160.00,'Previous balance (credit) - Debit Revenue - Anita Gwenda',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(815,416,51,'credit',160.00,'Previous balance (credit) - Credit Accounts Receivable - Anita Gwenda',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(816,416,53,'debit',160.00,'Previous balance (credit) - Debit Revenue - Anita Gwenda',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(817,417,51,'credit',180.00,'Previous balance (credit) - Credit Accounts Receivable - Bellis Mapetere',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(818,417,53,'debit',180.00,'Previous balance (credit) - Debit Revenue - Bellis Mapetere',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(819,418,51,'debit',10.00,'Previous balance (debit) - Debit Accounts Receivable - Bertha Majoni',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(820,418,53,'credit',10.00,'Previous balance (debit) - Credit Revenue - Bertha Majoni',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(821,419,51,'debit',35.00,'Previous balance (debit) - Debit Accounts Receivable - Chantelle Gora',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(822,419,53,'credit',35.00,'Previous balance (debit) - Credit Revenue - Chantelle Gora',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(823,420,51,'debit',80.00,'Previous balance (debit) - Debit Accounts Receivable - Christine Mutsikwa',10,6,'2025-11-13 09:38:09','2025-11-13 09:53:59','2025-11-13 09:53:59'),(824,420,53,'credit',80.00,'Previous balance (debit) - Credit Revenue - Christine Mutsikwa',10,6,'2025-11-13 09:38:09','2025-11-13 09:53:59','2025-11-13 09:53:59'),(825,421,51,'debit',80.00,'Previous balance (debit) - Debit Accounts Receivable - Dion sengamai',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(826,421,53,'credit',80.00,'Previous balance (debit) - Credit Revenue - Dion sengamai',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(827,422,51,'debit',20.00,'Previous balance (debit) - Debit Accounts Receivable - Emma Yoradin',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(828,422,53,'credit',20.00,'Previous balance (debit) - Credit Revenue - Emma Yoradin',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(829,423,51,'debit',61.00,'Previous balance (debit) - Debit Accounts Receivable - Fadzai Mhizha',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(830,423,53,'credit',61.00,'Previous balance (debit) - Credit Revenue - Fadzai Mhizha',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(831,424,51,'credit',40.00,'Previous balance (credit) - Credit Accounts Receivable - Farai Muzembe',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(832,424,53,'debit',40.00,'Previous balance (credit) - Debit Revenue - Farai Muzembe',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(833,425,51,'credit',35.00,'Previous balance (credit) - Credit Accounts Receivable - Fay Mubaiwa',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(834,425,53,'debit',35.00,'Previous balance (credit) - Debit Revenue - Fay Mubaiwa',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(835,426,51,'credit',460.00,'Previous balance (credit) - Credit Accounts Receivable - Grace Vutika',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(836,426,53,'debit',460.00,'Previous balance (credit) - Debit Revenue - Grace Vutika',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(837,427,51,'credit',35.00,'Previous balance (credit) - Credit Accounts Receivable - Kimbely Bones',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(838,427,53,'debit',35.00,'Previous balance (credit) - Debit Revenue - Kimbely Bones',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(839,428,51,'debit',240.00,'Previous balance (debit) - Debit Accounts Receivable - Kudzai Pemhiwa',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(840,428,53,'credit',240.00,'Previous balance (debit) - Credit Revenue - Kudzai Pemhiwa',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(841,429,51,'debit',20.00,'Previous balance (debit) - Debit Accounts Receivable - Leona Dengu',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(842,429,53,'credit',20.00,'Previous balance (debit) - Credit Revenue - Leona Dengu',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(843,430,51,'credit',30.00,'Previous balance (credit) - Credit Accounts Receivable - Merrylin Makunzva',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(844,430,53,'debit',30.00,'Previous balance (credit) - Debit Revenue - Merrylin Makunzva',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(845,431,51,'credit',180.00,'Previous balance (credit) - Credit Accounts Receivable - Natasha Chinho',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(846,431,53,'debit',180.00,'Previous balance (credit) - Debit Revenue - Natasha Chinho',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(847,432,51,'credit',320.00,'Previous balance (credit) - Credit Accounts Receivable - Paidamoyo Munyimi',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(848,432,53,'debit',320.00,'Previous balance (credit) - Debit Revenue - Paidamoyo Munyimi',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(849,433,51,'credit',190.00,'Previous balance (credit) - Credit Accounts Receivable - Pelagia Gomakalila',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(850,433,53,'debit',190.00,'Previous balance (credit) - Debit Revenue - Pelagia Gomakalila',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(851,434,51,'credit',133.00,'Previous balance (credit) - Credit Accounts Receivable - Precious Dziva',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(852,434,53,'debit',133.00,'Previous balance (credit) - Debit Revenue - Precious Dziva',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(853,435,51,'credit',540.00,'Previous balance (credit) - Credit Accounts Receivable - Rachel Madembe',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(854,435,53,'debit',540.00,'Previous balance (credit) - Debit Revenue - Rachel Madembe',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(855,436,51,'debit',30.00,'Previous balance (debit) - Debit Accounts Receivable - Ropafadzo Masara',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(856,436,53,'credit',30.00,'Previous balance (debit) - Credit Revenue - Ropafadzo Masara',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(857,437,51,'debit',2.00,'Previous balance (debit) - Debit Accounts Receivable - Rumbidzai Manyaora',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(858,437,53,'credit',2.00,'Previous balance (debit) - Credit Revenue - Rumbidzai Manyaora',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(859,438,51,'credit',20.00,'Previous balance (credit) - Credit Accounts Receivable - Salina Saidi',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(860,438,53,'debit',20.00,'Previous balance (credit) - Debit Revenue - Salina Saidi',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(861,439,51,'credit',280.00,'Previous balance (credit) - Credit Accounts Receivable - Sandra Chirinda',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(862,439,53,'debit',280.00,'Previous balance (credit) - Debit Revenue - Sandra Chirinda',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(863,440,51,'debit',35.00,'Previous balance (debit) - Debit Accounts Receivable - Shalom Gora',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(864,440,53,'credit',35.00,'Previous balance (debit) - Credit Revenue - Shalom Gora',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(865,441,51,'credit',98.00,'Previous balance (credit) - Credit Accounts Receivable - Shantel Mashe',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(866,441,53,'debit',98.00,'Previous balance (credit) - Debit Revenue - Shantel Mashe',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(867,442,51,'credit',98.00,'Previous balance (credit) - Credit Accounts Receivable - Sharon Matanha',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(868,442,53,'debit',98.00,'Previous balance (credit) - Debit Revenue - Sharon Matanha',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(869,443,51,'credit',100.00,'Previous balance (credit) - Credit Accounts Receivable - Tadiwa Mhloro',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(870,443,53,'debit',100.00,'Previous balance (credit) - Debit Revenue - Tadiwa Mhloro',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(871,444,51,'credit',180.00,'Previous balance (credit) - Credit Accounts Receivable - Takudzwa Makunde',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(872,444,53,'debit',180.00,'Previous balance (credit) - Debit Revenue - Takudzwa Makunde',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(873,445,51,'credit',40.00,'Previous balance (credit) - Credit Accounts Receivable - Tatenda Kamatando',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(874,445,53,'debit',40.00,'Previous balance (credit) - Debit Revenue - Tatenda Kamatando',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(875,446,51,'credit',180.00,'Previous balance (credit) - Credit Accounts Receivable - Tawana Kuwana',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(876,446,53,'debit',180.00,'Previous balance (credit) - Debit Revenue - Tawana Kuwana',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(877,447,51,'credit',80.00,'Previous balance (credit) - Credit Accounts Receivable - Thelma Nzvimari',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(878,447,53,'debit',80.00,'Previous balance (credit) - Debit Revenue - Thelma Nzvimari',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(879,448,51,'credit',10.00,'Previous balance (credit) - Credit Accounts Receivable - Tinotenda Bwangangwanyo',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(880,448,53,'debit',10.00,'Previous balance (credit) - Debit Revenue - Tinotenda Bwangangwanyo',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(881,449,51,'credit',20.00,'Previous balance (credit) - Credit Accounts Receivable - Tinotenda Chidavaenzi',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(882,449,53,'debit',20.00,'Previous balance (credit) - Debit Revenue - Tinotenda Chidavaenzi',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(883,450,51,'credit',5.00,'Previous balance (credit) - Credit Accounts Receivable - Tinotenda Magiga',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(884,450,53,'debit',5.00,'Previous balance (credit) - Debit Revenue - Tinotenda Magiga',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(885,451,51,'credit',80.00,'Previous balance (credit) - Credit Accounts Receivable - Trypheane Chinembiri',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(886,451,53,'debit',80.00,'Previous balance (credit) - Debit Revenue - Trypheane Chinembiri',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(887,452,51,'credit',5.00,'Previous balance (credit) - Credit Accounts Receivable - Vannessa Magorimbo',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(888,452,53,'debit',5.00,'Previous balance (credit) - Debit Revenue - Vannessa Magorimbo',10,6,'2025-09-29 22:00:00','2025-11-13 09:56:28',NULL),(889,453,47,'debit',21.08,'Initial balance for mako',10,6,'2025-11-13 10:01:40','2025-11-13 10:01:40',NULL),(890,453,81,'credit',21.08,'Initial balance for mako',10,6,'2025-11-13 10:01:40','2025-11-13 10:01:40',NULL),(895,456,49,'debit',150.35,'Opening Balance Set: Initial balance',10,6,'2025-11-13 10:03:31','2025-11-13 10:03:31',NULL),(896,456,81,'credit',150.35,'Opening Balance for CBZ Bank Account',10,6,'2025-11-13 10:03:31','2025-11-13 10:03:31',NULL),(897,455,48,'debit',0.00,'Opening Balance Set: Initial balance',10,6,'2025-11-13 10:03:58','2025-11-13 10:03:58',NULL),(898,455,81,'credit',0.00,'Opening Balance for Cash',10,6,'2025-11-13 10:03:58','2025-11-13 10:03:58',NULL),(899,457,48,'debit',2598.55,'Opening Balance Set: Initial balance',10,6,'2025-11-13 10:04:23','2025-11-13 10:04:23',NULL),(900,457,81,'credit',2598.55,'Opening Balance for Cash',10,6,'2025-11-13 10:04:23','2025-11-13 10:04:23',NULL),(901,458,50,'debit',1280.00,'Opening Balance Set: Initial balance',10,6,'2025-11-13 10:04:44','2025-11-13 10:04:44',NULL),(902,458,81,'credit',1280.00,'Opening Balance for CBZ Vault',10,6,'2025-11-13 10:04:44','2025-11-13 10:04:44',NULL),(903,454,48,'debit',0.00,'Opening Balance Set: Initial balance',10,6,'2025-11-13 10:04:55','2025-11-13 10:04:55',NULL),(904,454,81,'credit',0.00,'Opening Balance for Cash',10,6,'2025-11-13 10:04:55','2025-11-13 10:04:55',NULL),(911,461,47,'debit',100.00,'Petty Cash - Branch Payment 23',10,6,'2025-11-13 10:11:46','2025-11-13 10:11:46',NULL),(912,461,51,'credit',100.00,'Accounts Receivable - Branch Payment 23',10,6,'2025-11-13 10:11:46','2025-11-13 10:11:46',NULL),(913,459,47,'debit',160.00,'Petty Cash - Branch Payment 21',10,6,'2025-11-13 10:11:55','2025-11-13 10:11:55',NULL),(914,459,51,'credit',160.00,'Accounts Receivable - Branch Payment 21',10,6,'2025-11-13 10:11:55','2025-11-13 10:11:55',NULL),(915,460,47,'debit',180.00,'Petty Cash - Branch Payment 22',10,6,'2025-11-13 10:12:05','2025-11-13 10:12:05',NULL),(916,460,51,'credit',180.00,'Accounts Receivable - Branch Payment 22',10,6,'2025-11-13 10:12:05','2025-11-13 10:12:05',NULL),(917,462,47,'debit',180.00,'Petty Cash - Branch Payment 24',10,6,'2025-10-01 22:00:00','2025-11-13 10:14:56',NULL),(918,462,51,'credit',180.00,'Accounts Receivable - Branch Payment 24',10,6,'2025-10-01 22:00:00','2025-11-13 10:14:56',NULL),(919,463,47,'debit',190.00,'Petty Cash - Branch Payment 25',10,6,'2025-10-05 22:00:00','2025-11-13 10:15:20',NULL),(920,463,51,'credit',190.00,'Accounts Receivable - Branch Payment 25',10,6,'2025-10-05 22:00:00','2025-11-13 10:15:20',NULL),(921,464,47,'debit',160.00,'Petty Cash - Branch Payment 26',10,6,'2025-10-12 22:00:00','2025-11-13 10:15:39',NULL),(922,464,51,'credit',160.00,'Accounts Receivable - Branch Payment 26',10,6,'2025-10-12 22:00:00','2025-11-13 10:15:39',NULL),(923,465,47,'debit',160.00,'Petty Cash - Branch Payment 27',10,6,'2025-10-12 22:00:00','2025-11-13 10:16:24',NULL),(924,465,51,'credit',160.00,'Accounts Receivable - Branch Payment 27',10,6,'2025-10-12 22:00:00','2025-11-13 10:16:24',NULL),(925,466,47,'debit',35.00,'Petty Cash - Branch Payment 28',10,6,'2025-10-12 22:00:00','2025-11-13 10:16:40',NULL),(926,466,51,'credit',35.00,'Accounts Receivable - Branch Payment 28',10,6,'2025-10-12 22:00:00','2025-11-13 10:16:40',NULL),(927,467,47,'debit',160.00,'Petty Cash - Branch Payment 29',10,6,'2025-10-05 22:00:00','2025-11-13 10:18:22',NULL),(928,467,51,'credit',160.00,'Accounts Receivable - Branch Payment 29',10,6,'2025-10-05 22:00:00','2025-11-13 10:18:22',NULL),(929,468,47,'debit',160.00,'Petty Cash - Branch Payment 30',10,6,'2025-10-05 22:00:00','2025-11-13 10:18:45',NULL),(930,468,51,'credit',160.00,'Accounts Receivable - Branch Payment 30',10,6,'2025-10-05 22:00:00','2025-11-13 10:18:45',NULL),(933,470,47,'debit',160.00,'Petty Cash - Branch Payment 32',10,6,'2025-09-30 22:00:00','2025-11-13 10:19:23',NULL),(934,470,51,'credit',160.00,'Accounts Receivable - Branch Payment 32',10,6,'2025-09-30 22:00:00','2025-11-13 10:19:23',NULL),(935,471,47,'debit',120.00,'Petty Cash - Branch Payment 33',10,6,'2025-10-05 22:00:00','2025-11-13 10:19:42',NULL),(936,471,51,'credit',120.00,'Accounts Receivable - Branch Payment 33',10,6,'2025-10-05 22:00:00','2025-11-13 10:19:42',NULL),(937,472,47,'debit',160.00,'Petty Cash - Branch Payment 34',10,6,'2025-10-02 22:00:00','2025-11-13 10:20:00',NULL),(938,472,51,'credit',160.00,'Accounts Receivable - Branch Payment 34',10,6,'2025-10-02 22:00:00','2025-11-13 10:20:00',NULL),(939,473,47,'debit',320.00,'Petty Cash - Branch Payment 35',10,6,'2025-09-30 22:00:00','2025-11-13 10:21:39',NULL),(940,473,51,'credit',320.00,'Accounts Receivable - Branch Payment 35',10,6,'2025-09-30 22:00:00','2025-11-13 10:21:39',NULL),(941,474,47,'debit',180.00,'Petty Cash - Branch Payment 36',10,6,'2025-10-09 22:00:00','2025-11-13 10:21:53',NULL),(942,474,51,'credit',180.00,'Accounts Receivable - Branch Payment 36',10,6,'2025-10-09 22:00:00','2025-11-13 10:21:53',NULL),(943,475,47,'debit',160.00,'Petty Cash - Branch Payment 37',10,6,'2025-09-30 22:00:00','2025-11-13 10:22:08',NULL),(944,475,51,'credit',160.00,'Accounts Receivable - Branch Payment 37',10,6,'2025-09-30 22:00:00','2025-11-13 10:22:08',NULL),(945,476,47,'debit',130.00,'Petty Cash - Branch Payment 38',10,6,'2025-10-01 22:00:00','2025-11-13 10:22:29',NULL),(946,476,51,'credit',130.00,'Accounts Receivable - Branch Payment 38',10,6,'2025-10-01 22:00:00','2025-11-13 10:22:29',NULL),(947,477,47,'debit',50.00,'Petty Cash - Branch Payment 39',10,6,'2025-10-01 22:00:00','2025-11-13 10:22:48',NULL),(948,477,51,'credit',50.00,'Accounts Receivable - Branch Payment 39',10,6,'2025-10-01 22:00:00','2025-11-13 10:22:48',NULL),(949,478,47,'debit',120.00,'Petty Cash - Branch Payment 40',10,6,'2025-10-01 22:00:00','2025-11-13 10:23:20',NULL),(950,478,51,'credit',120.00,'Accounts Receivable - Branch Payment 40',10,6,'2025-10-01 22:00:00','2025-11-13 10:23:20',NULL),(951,479,47,'debit',180.00,'Petty Cash - Branch Payment 41',10,6,'2025-10-01 22:00:00','2025-11-13 10:24:33',NULL),(952,479,51,'credit',180.00,'Accounts Receivable - Branch Payment 41',10,6,'2025-10-01 22:00:00','2025-11-13 10:24:33',NULL),(953,480,47,'debit',170.00,'Petty Cash - Branch Payment 42',10,6,'2025-10-12 22:00:00','2025-11-13 10:24:48',NULL),(954,480,51,'credit',170.00,'Accounts Receivable - Branch Payment 42',10,6,'2025-10-12 22:00:00','2025-11-13 10:24:48',NULL),(955,481,47,'debit',180.00,'Petty Cash - Branch Payment 43',10,6,'2025-10-05 22:00:00','2025-11-13 10:25:06',NULL),(956,481,51,'credit',180.00,'Accounts Receivable - Branch Payment 43',10,6,'2025-10-05 22:00:00','2025-11-13 10:25:06',NULL),(957,482,47,'debit',160.00,'Petty Cash - Branch Payment 44',10,6,'2025-09-30 22:00:00','2025-11-13 10:25:29',NULL),(958,482,51,'credit',160.00,'Accounts Receivable - Branch Payment 44',10,6,'2025-09-30 22:00:00','2025-11-13 10:25:29',NULL),(959,483,47,'debit',160.00,'Petty Cash - Branch Payment 45',10,6,'2025-10-01 22:00:00','2025-11-13 10:25:54',NULL),(960,483,51,'credit',160.00,'Accounts Receivable - Branch Payment 45',10,6,'2025-10-01 22:00:00','2025-11-13 10:25:54',NULL),(961,484,47,'debit',150.00,'Petty Cash - Branch Payment 46',10,6,'2025-10-01 22:00:00','2025-11-13 10:26:14',NULL),(962,484,51,'credit',150.00,'Accounts Receivable - Branch Payment 46',10,6,'2025-10-01 22:00:00','2025-11-13 10:26:14',NULL),(963,485,47,'debit',190.00,'Petty Cash - Branch Payment 47',10,6,'2025-10-01 22:00:00','2025-11-13 10:26:38',NULL),(964,485,51,'credit',190.00,'Accounts Receivable - Branch Payment 47',10,6,'2025-10-01 22:00:00','2025-11-13 10:26:38',NULL),(965,486,47,'debit',190.00,'Petty Cash - Branch Payment 48',10,6,'2025-10-01 22:00:00','2025-11-13 10:26:53',NULL),(966,486,51,'credit',190.00,'Accounts Receivable - Branch Payment 48',10,6,'2025-10-01 22:00:00','2025-11-13 10:26:53',NULL),(967,487,47,'debit',160.00,'Petty Cash - Branch Payment 49',10,6,'2025-09-30 22:00:00','2025-11-13 10:27:06',NULL),(968,487,51,'credit',160.00,'Accounts Receivable - Branch Payment 49',10,6,'2025-09-30 22:00:00','2025-11-13 10:27:06',NULL),(969,488,47,'debit',120.00,'Petty Cash - Branch Payment 50',10,6,'2025-10-05 22:00:00','2025-11-13 10:27:28',NULL),(970,488,51,'credit',120.00,'Accounts Receivable - Branch Payment 50',10,6,'2025-10-05 22:00:00','2025-11-13 10:27:28',NULL),(971,489,47,'debit',20.00,'Petty Cash - Branch Payment 51',10,6,'2025-10-05 22:00:00','2025-11-13 10:27:43',NULL),(972,489,51,'credit',20.00,'Accounts Receivable - Branch Payment 51',10,6,'2025-10-05 22:00:00','2025-11-13 10:27:43',NULL),(973,490,47,'debit',150.00,'Petty Cash - Branch Payment 52',10,6,'2025-10-01 22:00:00','2025-11-13 10:28:06',NULL),(974,490,51,'credit',150.00,'Accounts Receivable - Branch Payment 52',10,6,'2025-10-01 22:00:00','2025-11-13 10:28:06',NULL),(975,491,47,'debit',160.00,'Petty Cash - Branch Payment 53',10,6,'2025-10-05 22:00:00','2025-11-13 10:29:02',NULL),(976,491,51,'credit',160.00,'Accounts Receivable - Branch Payment 53',10,6,'2025-10-05 22:00:00','2025-11-13 10:29:02',NULL),(977,492,47,'debit',170.00,'Petty Cash - Branch Payment 54',10,6,'2025-10-05 22:00:00','2025-11-13 10:29:21',NULL),(978,492,51,'credit',170.00,'Accounts Receivable - Branch Payment 54',10,6,'2025-10-05 22:00:00','2025-11-13 10:29:21',NULL),(979,493,47,'debit',160.00,'Petty Cash - Branch Payment 55',10,6,'2025-10-12 22:00:00','2025-11-13 10:33:36',NULL),(980,493,51,'credit',160.00,'Accounts Receivable - Branch Payment 55',10,6,'2025-10-12 22:00:00','2025-11-13 10:33:36',NULL),(981,494,47,'debit',35.00,'Petty Cash - Branch Payment 56',10,6,'2025-10-12 22:00:00','2025-11-13 10:33:48',NULL),(982,494,51,'credit',35.00,'Accounts Receivable - Branch Payment 56',10,6,'2025-10-12 22:00:00','2025-11-13 10:33:48',NULL),(983,495,47,'debit',180.00,'Petty Cash - Branch Payment 57',10,6,'2025-10-02 22:00:00','2025-11-13 10:34:05',NULL),(984,495,51,'credit',180.00,'Accounts Receivable - Branch Payment 57',10,6,'2025-10-02 22:00:00','2025-11-13 10:34:05',NULL),(985,496,47,'debit',180.00,'Petty Cash - Branch Payment 58',10,6,'2025-10-02 22:00:00','2025-11-13 10:34:32',NULL),(986,496,51,'credit',180.00,'Accounts Receivable - Branch Payment 58',10,6,'2025-10-02 22:00:00','2025-11-13 10:34:32',NULL),(987,497,47,'debit',82.00,'Petty Cash - Branch Payment 59',10,6,'2025-10-01 22:00:00','2025-11-13 10:35:00',NULL),(988,497,51,'credit',82.00,'Accounts Receivable - Branch Payment 59',10,6,'2025-10-01 22:00:00','2025-11-13 10:35:00',NULL),(989,498,47,'debit',160.00,'Petty Cash - Branch Payment 60',10,6,'2025-10-05 22:00:00','2025-11-13 10:37:33',NULL),(990,498,51,'credit',160.00,'Accounts Receivable - Branch Payment 60',10,6,'2025-10-05 22:00:00','2025-11-13 10:37:33',NULL),(991,499,47,'debit',200.00,'Petty Cash - Branch Payment 61',10,6,'2025-10-12 22:00:00','2025-11-13 10:37:55',NULL),(992,499,51,'credit',200.00,'Accounts Receivable - Branch Payment 61',10,6,'2025-10-12 22:00:00','2025-11-13 10:37:55',NULL),(993,500,47,'debit',200.00,'Petty Cash - Branch Payment 62',10,6,'2025-10-02 22:00:00','2025-11-13 10:38:21',NULL),(994,500,51,'credit',200.00,'Accounts Receivable - Branch Payment 62',10,6,'2025-10-02 22:00:00','2025-11-13 10:38:21',NULL),(995,501,47,'debit',160.00,'Petty Cash - Branch Payment 63',10,6,'2025-09-30 22:00:00','2025-11-13 10:38:37',NULL),(996,501,51,'credit',160.00,'Accounts Receivable - Branch Payment 63',10,6,'2025-09-30 22:00:00','2025-11-13 10:38:37',NULL),(997,502,47,'debit',200.00,'Petty Cash - Branch Payment 64',10,6,'2025-10-02 22:00:00','2025-11-13 10:39:27',NULL),(998,502,51,'credit',200.00,'Accounts Receivable - Branch Payment 64',10,6,'2025-10-02 22:00:00','2025-11-13 10:39:27',NULL),(999,503,47,'debit',60.00,'Petty Cash - Branch Payment 65',10,6,'2025-10-05 22:00:00','2025-11-13 10:39:53',NULL),(1000,503,51,'credit',60.00,'Accounts Receivable - Branch Payment 65',10,6,'2025-10-05 22:00:00','2025-11-13 10:39:53',NULL),(1001,504,47,'debit',10.00,'Petty Cash - Branch Payment 66',10,6,'2025-10-05 22:00:00','2025-11-13 10:40:04',NULL),(1002,504,51,'credit',10.00,'Accounts Receivable - Branch Payment 66',10,6,'2025-10-05 22:00:00','2025-11-13 10:40:04',NULL),(1003,505,47,'debit',170.00,'Petty Cash - Branch Payment 67',10,6,'2025-10-05 22:00:00','2025-11-13 10:40:25',NULL),(1004,505,51,'credit',170.00,'Accounts Receivable - Branch Payment 67',10,6,'2025-10-05 22:00:00','2025-11-13 10:40:25',NULL),(1005,506,47,'debit',140.00,'Petty Cash - Branch Payment 68',10,6,'2025-10-02 22:00:00','2025-11-13 10:40:41',NULL),(1006,506,51,'credit',140.00,'Accounts Receivable - Branch Payment 68',10,6,'2025-10-02 22:00:00','2025-11-13 10:40:41',NULL),(1007,507,47,'debit',165.00,'Petty Cash - Branch Payment 69',10,6,'2025-10-15 22:00:00','2025-11-13 10:41:04',NULL),(1008,507,51,'credit',165.00,'Accounts Receivable - Branch Payment 69',10,6,'2025-10-15 22:00:00','2025-11-13 10:41:04',NULL),(1009,508,47,'debit',100.00,'Petty Cash - Branch Payment 70',10,6,'2025-10-19 22:00:00','2025-11-13 10:41:20',NULL),(1010,508,51,'credit',100.00,'Accounts Receivable - Branch Payment 70',10,6,'2025-10-19 22:00:00','2025-11-13 10:41:20',NULL),(1011,509,47,'debit',125.00,'Petty Cash - Branch Payment 71',10,6,'2025-10-09 22:00:00','2025-11-13 10:41:34',NULL),(1012,509,51,'credit',125.00,'Accounts Receivable - Branch Payment 71',10,6,'2025-10-09 22:00:00','2025-11-13 10:41:34',NULL),(1013,510,47,'debit',30.00,'Petty Cash - Branch Payment 72',10,6,'2025-10-09 22:00:00','2025-11-13 10:41:47',NULL),(1014,510,51,'credit',30.00,'Accounts Receivable - Branch Payment 72',10,6,'2025-10-09 22:00:00','2025-11-13 10:41:47',NULL),(1015,511,47,'debit',160.00,'Petty Cash - Branch Payment 73',10,6,'2025-09-30 22:00:00','2025-11-13 10:42:27',NULL),(1016,511,51,'credit',160.00,'Accounts Receivable - Branch Payment 73',10,6,'2025-09-30 22:00:00','2025-11-13 10:42:27',NULL),(1017,512,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1018,512,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1019,513,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1020,513,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1021,514,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1022,514,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1023,515,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1024,515,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1025,516,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1026,516,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1027,517,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1028,517,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1029,518,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1030,518,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1031,519,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1032,519,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1033,520,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1034,520,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1035,521,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1036,521,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1037,522,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1038,522,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1039,523,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1040,523,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1041,524,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1042,524,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1043,525,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1044,525,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1045,526,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1046,526,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1047,527,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1048,527,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1049,528,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1050,528,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1051,529,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1052,529,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1053,530,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1054,530,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1055,531,51,'debit',220.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1056,531,53,'credit',220.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1057,532,51,'debit',120.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1058,532,53,'credit',120.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(1059,533,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1060,533,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1061,534,51,'debit',170.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1062,534,53,'credit',170.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1063,535,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1064,535,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1065,536,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1066,536,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1067,537,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1068,537,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1069,538,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1070,538,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1071,539,51,'debit',150.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1072,539,53,'credit',150.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1073,540,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1074,540,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1075,541,51,'debit',190.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1076,541,53,'credit',190.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1077,542,51,'debit',190.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1078,542,53,'credit',190.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1079,543,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1080,543,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1081,544,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1082,544,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1083,545,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1084,545,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1085,546,51,'debit',150.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1086,546,53,'credit',150.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1087,547,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1088,547,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1089,548,51,'debit',170.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1090,548,53,'credit',170.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1091,549,51,'debit',190.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1092,549,53,'credit',190.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1093,550,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1094,550,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1095,551,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1096,551,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1097,552,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1098,552,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1099,553,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1100,553,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1101,554,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1102,554,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1103,555,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1104,555,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1105,556,51,'debit',190.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1106,556,53,'credit',190.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1107,557,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1108,557,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1109,558,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1110,558,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1111,559,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1112,559,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1113,560,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1114,560,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1115,561,51,'debit',170.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1116,561,53,'credit',170.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1117,562,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1118,562,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1119,563,51,'debit',170.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1120,563,53,'credit',170.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1121,564,51,'debit',180.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1122,564,53,'credit',180.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1123,565,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1124,565,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1125,566,51,'debit',160.00,'Monthly invoice - Debit Accounts Receivable',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1126,566,53,'credit',160.00,'Monthly invoice - Credit Rentals Income',10,6,'2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(1127,567,51,'debit',20.00,'Admin fee receivable - Student 193',10,1,'2025-11-13 11:14:05','2025-11-13 11:14:05',NULL),(1128,567,53,'credit',20.00,'Admin fee income - Student 193',10,1,'2025-11-13 11:14:05','2025-11-13 11:14:05',NULL),(1129,568,51,'debit',180.00,'Initial invoice - Debit Accounts Receivable',10,1,'2025-11-13 11:14:05','2025-11-13 11:14:05',NULL),(1130,568,53,'credit',180.00,'Initial invoice - Credit Rentals Income',10,1,'2025-11-13 11:14:05','2025-11-13 11:14:05',NULL),(1131,469,47,'debit',160.00,'Petty Cash - Branch Payment 31',10,6,'2025-11-13 11:15:22','2025-11-13 11:15:22',NULL),(1132,469,51,'credit',160.00,'Accounts Receivable - Branch Payment 31',10,6,'2025-11-13 11:15:22','2025-11-13 11:15:22',NULL),(1133,569,51,'debit',20.00,'Admin fee receivable - Student 194',10,1,'2025-11-13 11:21:51','2025-11-13 11:21:51',NULL),(1134,569,53,'credit',20.00,'Admin fee income - Student 194',10,1,'2025-11-13 11:21:51','2025-11-13 11:21:51',NULL),(1135,570,51,'debit',160.00,'Initial invoice - Debit Accounts Receivable (Rent)',10,1,'2025-11-13 11:21:51','2025-11-13 11:21:51',NULL),(1136,570,53,'credit',160.00,'Initial invoice - Credit Rentals Income (Rent)',10,1,'2025-11-13 11:21:51','2025-11-13 11:21:51',NULL),(1137,571,47,'debit',180.00,'Petty Cash - Branch Payment 74',10,6,'2025-10-02 22:00:00','2025-11-13 11:22:24',NULL),(1138,571,51,'credit',180.00,'Accounts Receivable - Branch Payment 74',10,6,'2025-10-02 22:00:00','2025-11-13 11:22:24',NULL),(1139,572,47,'debit',220.00,'Petty Cash - Branch Payment 75',10,6,'2025-10-01 22:00:00','2025-11-13 11:22:43',NULL),(1140,572,51,'credit',220.00,'Accounts Receivable - Branch Payment 75',10,6,'2025-10-01 22:00:00','2025-11-13 11:22:43',NULL),(1141,573,47,'debit',522.00,'Petty Cash Addition: Replenish to pettycash',10,6,'2025-11-18 10:05:32','2025-11-18 10:05:32',NULL),(1142,573,48,'credit',522.00,'Petty Cash Addition from Cash',10,6,'2025-11-18 10:05:32','2025-11-18 10:05:32',NULL),(1143,574,58,'debit',250.00,'Expenditure Request: Water',10,6,'2025-11-18 10:06:48','2025-11-18 10:06:48',NULL),(1144,574,47,'credit',250.00,'Payment for: Water',10,6,'2025-11-18 10:06:48','2025-11-18 10:06:48',NULL),(1145,575,61,'debit',192.00,'Expenditure Request: Gas',10,6,'2025-11-18 10:08:57','2025-11-18 10:08:57',NULL),(1146,575,47,'credit',192.00,'Payment for: Gas',10,6,'2025-11-18 10:08:57','2025-11-18 10:08:57',NULL),(1147,576,57,'debit',40.00,'Expenditure Request: Solar service',10,6,'2025-11-18 10:11:44','2025-11-18 10:11:44',NULL),(1148,576,47,'credit',40.00,'Payment for: Solar service',10,6,'2025-11-18 10:11:44','2025-11-18 10:11:44',NULL),(1149,577,64,'debit',40.00,'Expenditure Request: firewood',10,6,'2025-11-18 10:14:44','2025-11-18 10:14:44',NULL),(1150,577,47,'credit',40.00,'Payment for: firewood',10,6,'2025-11-18 10:14:44','2025-11-18 10:14:44',NULL),(1151,578,48,'debit',1280.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 10:15:39','2025-11-18 10:15:39',NULL),(1152,578,47,'credit',1280.00,'Petty Cash Withdrawal: Rent collected',10,6,'2025-11-18 10:15:39','2025-11-18 10:15:39',NULL),(1153,579,48,'debit',1912.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 10:17:44','2025-11-18 10:17:44',NULL),(1154,579,47,'credit',1912.00,'Petty Cash Withdrawal: Rent collected ',10,6,'2025-11-18 10:17:44','2025-11-18 10:17:44',NULL),(1155,580,48,'debit',1040.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 10:18:47','2025-11-18 10:18:47',NULL),(1156,580,47,'credit',1040.00,'Petty Cash Withdrawal: rental collected',10,6,'2025-11-18 10:18:47','2025-11-18 10:18:47',NULL),(1157,581,47,'debit',700.00,'Petty Cash Addition: replenish pettycash',10,6,'2025-11-18 10:19:54','2025-11-18 10:19:54',NULL),(1158,581,48,'credit',700.00,'Petty Cash Addition from Cash',10,6,'2025-11-18 10:19:54','2025-11-18 10:19:54',NULL),(1161,582,65,'debit',400.00,'Expenditure Request: Security',10,6,'2025-11-18 10:25:29','2025-11-18 10:25:29',NULL),(1162,582,47,'credit',400.00,'Payment for: Security',10,6,'2025-11-18 10:25:29','2025-11-18 10:25:29',NULL),(1163,583,58,'debit',250.00,'Expenditure Request: Water',10,6,'2025-11-18 12:13:11','2025-11-18 12:13:11',NULL),(1164,583,47,'credit',250.00,'Payment for: Water',10,6,'2025-11-18 12:13:11','2025-11-18 12:13:11',NULL),(1165,584,48,'debit',305.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 12:14:03','2025-11-18 12:14:03',NULL),(1166,584,47,'credit',305.00,'Petty Cash Withdrawal: Rental collection',10,6,'2025-11-18 12:14:03','2025-11-18 12:14:03',NULL),(1167,585,47,'debit',90.00,'Petty Cash Addition: replenish pettycash',10,6,'2025-11-18 12:14:52','2025-11-18 12:14:52',NULL),(1168,585,48,'credit',90.00,'Petty Cash Addition from Cash',10,6,'2025-11-18 12:14:52','2025-11-18 12:14:52',NULL),(1169,586,63,'debit',90.00,'Expenditure Request: Sanitary',10,6,'2025-11-18 12:16:36','2025-11-18 12:16:36',NULL),(1170,586,47,'credit',90.00,'Payment for: Sanitary',10,6,'2025-11-18 12:16:36','2025-11-18 12:16:36',NULL),(1171,587,48,'debit',870.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 12:17:23','2025-11-18 12:17:23',NULL),(1172,587,47,'credit',870.00,'Petty Cash Withdrawal: Rentals surrendered',10,6,'2025-11-18 12:17:23','2025-11-18 12:17:23',NULL),(1173,588,47,'debit',260.00,'Petty Cash Addition: replenish pettycash',10,6,'2025-11-18 12:18:06','2025-11-18 12:18:06',NULL),(1174,588,48,'credit',260.00,'Petty Cash Addition from Cash',10,6,'2025-11-18 12:18:06','2025-11-18 12:18:06',NULL),(1175,589,58,'debit',150.00,'Expenditure Request: water',10,6,'2025-11-18 12:19:25','2025-11-18 12:19:25',NULL),(1176,589,47,'credit',150.00,'Payment for: water',10,6,'2025-11-18 12:19:25','2025-11-18 12:19:25',NULL),(1177,590,57,'debit',40.00,'Expenditure Request: firewood',10,6,'2025-11-18 12:20:59','2025-11-18 12:20:59',NULL),(1178,590,47,'credit',40.00,'Payment for: firewood',10,6,'2025-11-18 12:20:59','2025-11-18 12:20:59',NULL),(1179,591,80,'debit',30.00,'Expenditure Request: Wifi fixing misc',10,6,'2025-11-18 12:22:22','2025-11-18 12:22:22',NULL),(1180,591,47,'credit',30.00,'Payment for: Wifi fixing misc',10,6,'2025-11-18 12:22:22','2025-11-18 12:22:22',NULL),(1181,592,63,'debit',10.00,'Expenditure Request: Cleaning supplies',10,6,'2025-11-18 12:23:44','2025-11-18 12:23:44',NULL),(1182,592,47,'credit',10.00,'Payment for: Cleaning supplies',10,6,'2025-11-18 12:23:44','2025-11-18 12:23:44',NULL),(1183,593,73,'debit',30.00,'Expenditure Request: Garbage collection',10,6,'2025-11-18 12:25:19','2025-11-18 12:25:19',NULL),(1184,593,47,'credit',30.00,'Payment for: Garbage collection',10,6,'2025-11-18 12:25:19','2025-11-18 12:25:19',NULL),(1185,594,48,'debit',165.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 12:27:00','2025-11-18 12:27:00',NULL),(1186,594,47,'credit',165.00,'Petty Cash Withdrawal: rentals collected',10,6,'2025-11-18 12:27:00','2025-11-18 12:27:00',NULL),(1187,595,48,'debit',260.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 12:27:29','2025-11-18 12:27:29',NULL),(1188,595,47,'credit',260.00,'Petty Cash Withdrawal: rentals collected',10,6,'2025-11-18 12:27:29','2025-11-18 12:27:29',NULL),(1189,596,47,'debit',100.00,'Petty Cash Addition: replenish pettycash',10,6,'2025-11-18 12:28:15','2025-11-18 12:28:15',NULL),(1190,596,48,'credit',100.00,'Petty Cash Addition from Cash',10,6,'2025-11-18 12:28:15','2025-11-18 12:28:15',NULL),(1191,597,58,'debit',100.00,'Expenditure Request: water',10,6,'2025-11-18 12:29:05','2025-11-18 12:29:05',NULL),(1192,597,47,'credit',100.00,'Payment for: water',10,6,'2025-11-18 12:29:05','2025-11-18 12:29:05',NULL),(1193,598,48,'debit',1810.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 12:31:12','2025-11-18 12:31:12',NULL),(1194,598,47,'credit',1810.00,'Petty Cash Withdrawal: rentalsa recevied',10,6,'2025-11-18 12:31:12','2025-11-18 12:31:12',NULL),(1195,599,48,'debit',100.00,'Petty Cash Withdrawal to Cash',10,6,'2025-11-18 12:32:20','2025-11-18 12:32:20',NULL),(1196,599,47,'credit',100.00,'Petty Cash Withdrawal: rentals',10,6,'2025-11-18 12:32:20','2025-11-18 12:32:20',NULL),(1201,602,57,'debit',200.00,'water expenses - Expense',10,1,'2025-11-18 12:36:41','2025-11-18 12:36:41',NULL),(1202,602,48,'credit',200.00,'water expenses - Payment',10,1,'2025-11-18 12:36:41','2025-11-18 12:36:41',NULL),(1203,603,82,'debit',100.00,'city council rates - Expense',10,1,'2025-11-18 12:37:31','2025-11-18 12:37:31',NULL),(1204,603,48,'credit',100.00,'city council rates - Payment',10,1,'2025-11-18 12:37:31','2025-11-18 12:37:31',NULL),(1205,604,80,'debit',100.00,'wifi - Expense',10,1,'2025-11-18 12:38:20','2025-11-18 12:38:20',NULL),(1206,604,48,'credit',100.00,'wifi - Payment',10,1,'2025-11-18 12:38:20','2025-11-18 12:38:20',NULL),(1207,605,66,'debit',1300.00,'ALAMAIT MANAGEMENT FEE - Expense',10,1,'2025-11-18 12:45:06','2025-11-18 12:45:06',NULL),(1208,605,48,'credit',1300.00,'ALAMAIT MANAGEMENT FEE - Payment',10,1,'2025-11-18 12:45:06','2025-11-18 12:45:06',NULL),(1209,606,83,'debit',2000.00,'payment rental meadow and willow - Expense',10,1,'2025-11-18 12:48:41','2025-11-18 12:48:41',NULL),(1210,606,48,'credit',2000.00,'payment rental meadow and willow - Payment',10,1,'2025-11-18 12:48:41','2025-11-18 12:48:41',NULL),(1211,600,49,'debit',200.00,'Petty Cash Withdrawal to Cash',10,6,'2025-10-02 22:00:00','2025-11-18 12:50:57',NULL),(1212,600,47,'credit',200.00,'Petty Cash Withdrawal: rentals via bank',10,6,'2025-10-02 22:00:00','2025-11-18 12:50:57',NULL),(1213,601,49,'debit',180.00,'Petty Cash Withdrawal to Cash',10,6,'2025-10-16 22:00:00','2025-11-18 12:51:39',NULL),(1214,601,47,'credit',180.00,'Petty Cash Withdrawal: rentals via bank',10,6,'2025-10-16 22:00:00','2025-11-18 12:51:39',NULL),(1217,607,66,'debit',1115.00,'alamait management fee - Expense',10,6,'2025-10-29 22:00:00','2025-11-18 13:00:19',NULL),(1218,607,48,'credit',1115.00,'alamait management fee - Payment',10,6,'2025-10-29 22:00:00','2025-11-18 13:00:19',NULL),(1219,608,65,'debit',185.00,'rapid response - Expense',10,1,'2025-11-18 13:05:55','2025-11-18 13:05:55',NULL),(1220,608,49,'credit',185.00,'rapid response - Payment',10,1,'2025-11-18 13:05:55','2025-11-18 13:05:55',NULL),(1221,609,84,'debit',5.60,'Bank charges - Expense',10,1,'2025-11-18 13:07:40','2025-11-18 13:07:40',NULL),(1222,609,49,'credit',5.60,'Bank charges - Payment',10,1,'2025-11-18 13:07:40','2025-11-18 13:07:40',NULL),(1223,610,50,'debit',500.00,'Transfer from Cash: tranfer to cbz vault',10,6,'2025-11-18 13:10:03','2025-11-18 13:10:03',NULL),(1224,610,48,'credit',500.00,'Transfer to CBZ Vault: tranfer to cbz vault',10,6,'2025-11-18 13:10:03','2025-11-18 13:10:03',NULL);
/*!40000 ALTER TABLE `journal_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_lines`
--

DROP TABLE IF EXISTS `journal_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `journal_entry_id` int DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_lines`
--

LOCK TABLES `journal_lines` WRITE;
/*!40000 ALTER TABLE `journal_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `next_of_kin`
--

DROP TABLE IF EXISTS `next_of_kin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `next_of_kin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `relation` varchar(100) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `next_of_kin`
--

LOCK TABLES `next_of_kin` WRITE;
/*!40000 ALTER TABLE `next_of_kin` DISABLE KEYS */;
/*!40000 ALTER TABLE `next_of_kin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_receipts`
--

DROP TABLE IF EXISTS `payment_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `payment_receipts_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `student_payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_receipts`
--

LOCK TABLES `payment_receipts` WRITE;
/*!40000 ALTER TABLE `payment_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petty_cash_accounts`
--

DROP TABLE IF EXISTS `petty_cash_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petty_cash_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `petty_cash_user_id` int DEFAULT NULL,
  `boarding_house_id` int NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `account_code` varchar(20) NOT NULL,
  `initial_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `beginning_balance` decimal(15,2) DEFAULT '0.00',
  `total_inflows` decimal(15,2) DEFAULT '0.00',
  `total_outflows` decimal(15,2) DEFAULT '0.00',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_boarding_house` (`user_id`,`boarding_house_id`,`deleted_at`),
  KEY `created_by` (`created_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_boarding_house_id` (`boarding_house_id`),
  KEY `idx_status` (`status`),
  KEY `idx_petty_cash_user_id` (`petty_cash_user_id`),
  CONSTRAINT `fk_petty_cash_accounts_user` FOREIGN KEY (`petty_cash_user_id`) REFERENCES `petty_cash_users` (`id`),
  CONSTRAINT `petty_cash_accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `petty_cash_accounts_ibfk_2` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `petty_cash_accounts_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petty_cash_accounts`
--

LOCK TABLES `petty_cash_accounts` WRITE;
/*!40000 ALTER TABLE `petty_cash_accounts` DISABLE KEYS */;
INSERT INTO `petty_cash_accounts` VALUES (24,NULL,6,10,'mako','PC-006',21.08,71.08,0.00,1693.08,9744.00,'active',6,'2025-11-13 10:01:40','2025-11-18 12:34:30',NULL);
/*!40000 ALTER TABLE `petty_cash_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petty_cash_transactions`
--

DROP TABLE IF EXISTS `petty_cash_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petty_cash_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `boarding_house_id` int NOT NULL,
  `transaction_type` enum('cash_inflow','cash_outflow','withdrawal','expense','student_payment','beginning_balance') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `transaction_date` date NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boarding_house` (`boarding_house_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `petty_cash_transactions_ibfk_1` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`),
  CONSTRAINT `petty_cash_transactions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `petty_cash_transactions_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=469 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petty_cash_transactions`
--

LOCK TABLES `petty_cash_transactions` WRITE;
/*!40000 ALTER TABLE `petty_cash_transactions` DISABLE KEYS */;
INSERT INTO `petty_cash_transactions` VALUES (385,6,10,'cash_inflow',160.00,'Payment from Agape Chiware',NULL,NULL,'2025-11-13',6,'2025-11-13 10:07:53'),(386,6,10,'cash_inflow',180.00,'Payment from Alicia Mutamuko',NULL,NULL,'2025-11-13',6,'2025-11-13 10:08:25'),(387,6,10,'cash_inflow',100.00,'Payment from Anita Gwenda',NULL,NULL,'2025-11-13',6,'2025-11-13 10:08:54'),(388,6,10,'cash_inflow',180.00,'Payment from Bellis Mapetere',NULL,NULL,'2025-11-13',6,'2025-11-13 10:14:56'),(389,6,10,'cash_inflow',190.00,'Payment from Bertha Majoni',NULL,NULL,'2025-11-13',6,'2025-11-13 10:15:20'),(390,6,10,'cash_inflow',160.00,'Payment from Bertha Mwangu',NULL,NULL,'2025-11-13',6,'2025-11-13 10:15:39'),(391,6,10,'cash_inflow',160.00,'Payment from Chantelle Gora',NULL,NULL,'2025-11-13',6,'2025-11-13 10:16:24'),(392,6,10,'cash_inflow',35.00,'Payment from Chantelle Gora',NULL,NULL,'2025-11-13',6,'2025-11-13 10:16:40'),(393,6,10,'cash_inflow',160.00,'Payment from Christine Mutsikwa',NULL,NULL,'2025-11-13',6,'2025-11-13 10:18:22'),(394,6,10,'cash_inflow',160.00,'Payment from Dion sengamai',NULL,NULL,'2025-11-13',6,'2025-11-13 10:18:45'),(395,6,10,'cash_inflow',160.00,'Payment from Emma Yoradin',NULL,NULL,'2025-11-13',6,'2025-11-13 10:19:06'),(396,6,10,'cash_inflow',160.00,'Payment from Fadzai Mhizha',NULL,NULL,'2025-11-13',6,'2025-11-13 10:19:23'),(397,6,10,'cash_inflow',120.00,'Payment from Farai Muzembe',NULL,NULL,'2025-11-13',6,'2025-11-13 10:19:42'),(398,6,10,'cash_inflow',160.00,'Payment from Fay Mubaiwa',NULL,NULL,'2025-11-13',6,'2025-11-13 10:20:00'),(399,6,10,'cash_inflow',320.00,'Payment from Kimbely Bones',NULL,NULL,'2025-11-13',6,'2025-11-13 10:21:39'),(400,6,10,'cash_inflow',180.00,'Payment from Kimberly Mutowembwa',NULL,NULL,'2025-11-13',6,'2025-11-13 10:21:53'),(401,6,10,'cash_inflow',160.00,'Payment from Kimberly Nkomo',NULL,NULL,'2025-11-13',6,'2025-11-13 10:22:08'),(402,6,10,'cash_inflow',130.00,'Payment from Kudzai Matare',NULL,NULL,'2025-11-13',6,'2025-11-13 10:22:29'),(403,6,10,'cash_inflow',50.00,'Payment from Kudzai Matare',NULL,NULL,'2025-11-13',6,'2025-11-13 10:22:48'),(404,6,10,'cash_inflow',120.00,'Payment from Kuziwa',NULL,NULL,'2025-11-13',6,'2025-11-13 10:23:21'),(405,6,10,'cash_inflow',180.00,'Payment from Lillian Chatikobo',NULL,NULL,'2025-11-13',6,'2025-11-13 10:24:33'),(406,6,10,'cash_inflow',170.00,'Payment from Lorraine Mlambo',NULL,NULL,'2025-11-13',6,'2025-11-13 10:24:48'),(407,6,10,'cash_inflow',180.00,'Payment from Merrylin Makunzva',NULL,NULL,'2025-11-13',6,'2025-11-13 10:25:06'),(408,6,10,'cash_inflow',160.00,'Payment from Mitchel Chikosha',NULL,NULL,'2025-11-13',6,'2025-11-13 10:25:29'),(409,6,10,'cash_inflow',160.00,'Payment from Munashe',NULL,NULL,'2025-11-13',6,'2025-11-13 10:25:54'),(410,6,10,'cash_inflow',150.00,'Payment from Nyashadzashe Chinorwiwa',NULL,NULL,'2025-11-13',6,'2025-11-13 10:26:14'),(411,6,10,'cash_inflow',190.00,'Payment from Pelagia Gomakalila',NULL,NULL,'2025-11-13',6,'2025-11-13 10:26:38'),(412,6,10,'cash_inflow',190.00,'Payment from Precious Dziva',NULL,NULL,'2025-11-13',6,'2025-11-13 10:26:53'),(413,6,10,'cash_inflow',160.00,'Payment from Precious Mashava',NULL,NULL,'2025-11-13',6,'2025-11-13 10:27:06'),(414,6,10,'cash_inflow',120.00,'Payment from Ropafadzo Masara',NULL,NULL,'2025-11-13',6,'2025-11-13 10:27:28'),(415,6,10,'cash_inflow',20.00,'Payment from Ropafadzo Masara',NULL,NULL,'2025-11-13',6,'2025-11-13 10:27:43'),(416,6,10,'cash_inflow',150.00,'Payment from Rumbidzai Manyaora',NULL,NULL,'2025-11-13',6,'2025-11-13 10:28:06'),(417,6,10,'cash_inflow',160.00,'Payment from Ruvimbo Singe',NULL,NULL,'2025-11-13',6,'2025-11-13 10:29:02'),(418,6,10,'cash_inflow',170.00,'Payment from Salina Saidi',NULL,NULL,'2025-11-13',6,'2025-11-13 10:29:21'),(419,6,10,'cash_inflow',160.00,'Payment from Shalom Gora',NULL,NULL,'2025-11-13',6,'2025-11-13 10:33:36'),(420,6,10,'cash_inflow',35.00,'Payment from Shalom Gora',NULL,NULL,'2025-11-13',6,'2025-11-13 10:33:48'),(421,6,10,'cash_inflow',180.00,'Payment from Shantel Mashe',NULL,NULL,'2025-11-13',6,'2025-11-13 10:34:05'),(422,6,10,'cash_inflow',180.00,'Payment from Shantell Mawarira',NULL,NULL,'2025-11-13',6,'2025-11-13 10:34:32'),(423,6,10,'cash_inflow',82.00,'Payment from Sharon Matanha',NULL,NULL,'2025-11-13',6,'2025-11-13 10:35:00'),(424,6,10,'cash_inflow',160.00,'Payment from Tadiwa',NULL,NULL,'2025-11-13',6,'2025-11-13 10:37:33'),(425,6,10,'cash_inflow',200.00,'Payment from Tadiwa Mhloro',NULL,NULL,'2025-11-13',6,'2025-11-13 10:37:55'),(426,6,10,'cash_inflow',200.00,'Payment from Takudzwa Makunde',NULL,NULL,'2025-11-13',6,'2025-11-13 10:38:21'),(427,6,10,'cash_inflow',160.00,'Payment from Tanaka Chikonyera',NULL,NULL,'2025-11-13',6,'2025-11-13 10:38:37'),(428,6,10,'cash_inflow',200.00,'Payment from Tatenda Kamatando',NULL,NULL,'2025-11-13',6,'2025-11-13 10:39:27'),(429,6,10,'cash_inflow',60.00,'Payment from Thelma Nzvimari',NULL,NULL,'2025-11-13',6,'2025-11-13 10:39:53'),(430,6,10,'cash_inflow',10.00,'Payment from Thelma Nzvimari',NULL,NULL,'2025-11-13',6,'2025-11-13 10:40:04'),(431,6,10,'cash_inflow',170.00,'Payment from Tinotenda Bwangangwanyo',NULL,NULL,'2025-11-13',6,'2025-11-13 10:40:25'),(432,6,10,'cash_inflow',140.00,'Payment from Tinotenda Chidavaenzi',NULL,NULL,'2025-11-13',6,'2025-11-13 10:40:41'),(433,6,10,'cash_inflow',165.00,'Payment from Tinotenda Magiga',NULL,NULL,'2025-11-13',6,'2025-11-13 10:41:04'),(434,6,10,'cash_inflow',100.00,'Payment from Trypheane Chinembiri',NULL,NULL,'2025-11-13',6,'2025-11-13 10:41:20'),(435,6,10,'cash_inflow',125.00,'Payment from Vannessa Magorimbo',NULL,NULL,'2025-11-13',6,'2025-11-13 10:41:34'),(436,6,10,'cash_inflow',30.00,'Payment from Vannessa Magorimbo',NULL,NULL,'2025-11-13',6,'2025-11-13 10:41:47'),(437,6,10,'cash_inflow',160.00,'Payment from Vimbai',NULL,NULL,'2025-11-13',6,'2025-11-13 10:42:27'),(438,6,10,'cash_inflow',180.00,'Payment from Sharmaine Tinarwo',NULL,NULL,'2025-11-13',6,'2025-11-13 11:22:24'),(439,6,10,'cash_inflow',220.00,'Payment from Tanaka Matematema',NULL,NULL,'2025-11-13',6,'2025-11-13 11:22:43'),(440,6,10,'cash_inflow',522.00,'Replenish to pettycash','','','2025-10-01',6,'2025-11-18 10:05:32'),(441,6,10,'cash_outflow',250.00,'Expenditure: Water',NULL,NULL,'2025-11-18',6,'2025-11-18 10:06:48'),(442,6,10,'cash_outflow',192.00,'Expenditure: Gas',NULL,NULL,'2025-11-18',6,'2025-11-18 10:08:57'),(443,6,10,'cash_outflow',40.00,'Expenditure: Solar service',NULL,NULL,'2025-11-18',6,'2025-11-18 10:11:44'),(444,6,10,'cash_outflow',40.00,'Expenditure: firewood',NULL,NULL,'2025-11-18',6,'2025-11-18 10:14:44'),(445,6,10,'cash_outflow',1280.00,'Rent collected','','','2025-10-01',6,'2025-11-18 10:15:39'),(446,6,10,'cash_outflow',1912.00,'Rent collected ','','','2025-10-01',6,'2025-11-18 10:17:44'),(447,6,10,'cash_outflow',1040.00,'rental collected','','','2025-10-01',6,'2025-11-18 10:18:47'),(448,6,10,'cash_inflow',700.00,'replenish pettycash','','','2025-10-10',6,'2025-11-18 10:19:54'),(449,6,10,'cash_outflow',400.00,'Expenditure: Security',NULL,NULL,'2025-11-18',6,'2025-11-18 10:24:20'),(450,6,10,'cash_outflow',250.00,'Expenditure: Water',NULL,NULL,'2025-11-18',6,'2025-11-18 12:13:11'),(451,6,10,'cash_outflow',305.00,'Rental collection','','','2025-10-11',6,'2025-11-18 12:14:03'),(452,6,10,'cash_inflow',90.00,'replenish pettycash','','','2025-10-10',6,'2025-11-18 12:14:52'),(453,6,10,'cash_outflow',90.00,'Expenditure: Sanitary',NULL,NULL,'2025-11-18',6,'2025-11-18 12:16:36'),(454,6,10,'cash_outflow',870.00,'Rentals surrendered','','','2025-11-13',6,'2025-11-18 12:17:23'),(455,6,10,'cash_inflow',260.00,'replenish pettycash','','','2025-10-16',6,'2025-11-18 12:18:06'),(456,6,10,'cash_outflow',150.00,'Expenditure: water',NULL,NULL,'2025-11-18',6,'2025-11-18 12:19:25'),(457,6,10,'cash_outflow',40.00,'Expenditure: firewood',NULL,NULL,'2025-11-18',6,'2025-11-18 12:20:59'),(458,6,10,'cash_outflow',30.00,'Expenditure: Wifi fixing misc',NULL,NULL,'2025-11-18',6,'2025-11-18 12:22:22'),(459,6,10,'cash_outflow',10.00,'Expenditure: Cleaning supplies',NULL,NULL,'2025-11-18',6,'2025-11-18 12:23:44'),(460,6,10,'cash_outflow',30.00,'Expenditure: Garbage collection',NULL,NULL,'2025-11-18',6,'2025-11-18 12:25:19'),(461,6,10,'cash_outflow',165.00,'rentals collected','','','2025-10-16',6,'2025-11-18 12:27:00'),(462,6,10,'cash_outflow',260.00,'rentals collected','','','2025-10-20',6,'2025-11-18 12:27:29'),(463,6,10,'cash_inflow',100.00,'replenish pettycash','','','2025-10-23',6,'2025-11-18 12:28:15'),(464,6,10,'cash_outflow',100.00,'Expenditure: water',NULL,NULL,'2025-11-18',6,'2025-11-18 12:29:05'),(465,6,10,'cash_outflow',1810.00,'rentalsa recevied','','','2025-10-03',6,'2025-11-18 12:31:12'),(466,6,10,'cash_outflow',100.00,'rentals','','','2025-10-27',6,'2025-11-18 12:32:20'),(467,6,10,'cash_outflow',200.00,'rentals via bank','','','2025-10-03',6,'2025-11-18 12:33:49'),(468,6,10,'cash_outflow',180.00,'rentals via bank','','','2025-10-17',6,'2025-11-18 12:34:30');
/*!40000 ALTER TABLE `petty_cash_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petty_cash_users`
--

DROP TABLE IF EXISTS `petty_cash_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petty_cash_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `boarding_house_id` int NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `created_by` (`created_by`),
  KEY `idx_username` (`username`),
  KEY `idx_boarding_house` (`boarding_house_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `petty_cash_users_ibfk_1` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`),
  CONSTRAINT `petty_cash_users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petty_cash_users`
--

LOCK TABLES `petty_cash_users` WRITE;
/*!40000 ALTER TABLE `petty_cash_users` DISABLE KEYS */;
INSERT INTO `petty_cash_users` VALUES (6,'mako','$2b$10$yQkyfETPl55BXd.rL5a5dutawSvXe00AGC1IikrHUsXQOi46nnG2W',NULL,NULL,NULL,10,'active',6,'2025-11-13 10:01:40','2025-11-13 10:01:40',NULL);
/*!40000 ALTER TABLE `petty_cash_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reconciliation_items`
--

DROP TABLE IF EXISTS `reconciliation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reconciliation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reconciliation_id` int NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `journal_entry_id` int DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `entry_type` enum('debit','credit') NOT NULL,
  `transaction_date` date NOT NULL,
  `is_reconciled` tinyint(1) DEFAULT '0',
  `bank_reference` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reconciliation_id` (`reconciliation_id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `journal_entry_id` (`journal_entry_id`),
  CONSTRAINT `reconciliation_items_ibfk_1` FOREIGN KEY (`reconciliation_id`) REFERENCES `account_reconciliations` (`id`),
  CONSTRAINT `reconciliation_items_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`),
  CONSTRAINT `reconciliation_items_ibfk_3` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reconciliation_items`
--

LOCK TABLES `reconciliation_items` WRITE;
/*!40000 ALTER TABLE `reconciliation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `reconciliation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rentals`
--

DROP TABLE IF EXISTS `rentals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rentals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rentals`
--

LOCK TABLES `rentals` WRITE;
/*!40000 ALTER TABLE `rentals` DISABLE KEYS */;
/*!40000 ALTER TABLE `rentals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_type` varchar(50) DEFAULT NULL,
  `generated_by` int DEFAULT NULL,
  `boarding_house_id` int DEFAULT NULL,
  `content` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_images`
--

DROP TABLE IF EXISTS `room_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `is_display_image` tinyint(1) DEFAULT '0',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_room_id` (`room_id`),
  KEY `idx_display_image` (`is_display_image`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `room_images_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `room_images_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_images`
--

LOCK TABLES `room_images` WRITE;
/*!40000 ALTER TABLE `room_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `capacity` int NOT NULL,
  `bed_count` int DEFAULT '0',
  `available_beds` int NOT NULL,
  `price_per_bed` decimal(10,2) NOT NULL,
  `description` text,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `boarding_house_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `admin_fee` decimal(15,2) DEFAULT '0.00',
  `security_deposit` decimal(15,2) DEFAULT '0.00',
  `additional_rent` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_rooms_boarding_house` (`boarding_house_id`),
  KEY `idx_rooms_status` (`status`),
  KEY `idx_rooms_admin_fee` (`admin_fee`),
  KEY `idx_rooms_security_deposit` (`security_deposit`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (45,'BUS1',6,6,0,160.00,'','active',10,'2025-11-10 19:45:55','2025-11-10 21:59:08',NULL,0.00,0.00,0.00),(46,'BUS2',5,5,0,160.00,'','active',10,'2025-11-10 19:46:59','2025-11-10 21:56:40',NULL,0.00,0.00,0.00),(47,'C1',2,2,0,190.00,'','active',10,'2025-11-10 19:47:34','2025-11-10 21:44:18',NULL,0.00,0.00,0.00),(48,'C2',2,2,0,190.00,'','active',10,'2025-11-10 19:48:06','2025-11-10 21:52:06',NULL,0.00,0.00,0.00),(49,'Executive',1,1,0,220.00,'','active',10,'2025-11-10 19:50:34','2025-11-10 21:18:26',NULL,0.00,0.00,0.00),(50,'EXT1',6,6,0,160.00,'','active',10,'2025-11-10 19:52:37','2025-11-13 11:21:51',NULL,0.00,0.00,0.00),(51,'EXT2',5,5,0,160.00,'','active',10,'2025-11-10 19:53:41','2025-11-11 12:35:32',NULL,0.00,0.00,0.00),(52,'M1',3,3,0,180.00,'','active',10,'2025-11-10 19:55:00','2025-11-10 21:51:27',NULL,0.00,0.00,0.00),(53,'M2',4,4,0,170.00,'','active',10,'2025-11-10 19:55:39','2025-11-10 21:57:30',NULL,0.00,0.00,0.00),(54,'M3',3,3,1,180.00,'','active',10,'2025-11-10 19:56:25','2025-11-13 11:06:00',NULL,0.00,0.00,0.00),(55,'M4',3,3,0,180.00,'','active',10,'2025-11-10 19:57:40','2025-11-10 21:49:30',NULL,0.00,0.00,0.00),(56,'M5',3,3,0,180.00,'','active',10,'2025-11-10 19:58:49','2025-11-10 21:58:21',NULL,0.00,0.00,0.00),(57,'M6',3,3,0,180.00,'','active',10,'2025-11-10 19:59:42','2025-11-13 11:14:05',NULL,0.00,0.00,0.00),(58,'M7',3,3,0,180.00,'','active',10,'2025-11-10 20:00:40','2025-11-10 21:54:24',NULL,0.00,0.00,0.00),(59,'M8',6,6,0,160.00,'','active',10,'2025-11-10 20:02:45','2025-11-10 21:59:57',NULL,0.00,0.00,0.00),(60,'Upstairs 1',1,2,-1,120.00,'Great room','active',10,'2025-11-10 20:03:11','2025-11-11 14:05:46',NULL,0.00,0.00,0.00),(61,'Upstair 2',2,2,1,150.00,'','active',10,'2025-11-10 20:03:43','2025-11-10 21:20:06',NULL,0.00,0.00,0.00);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_income_statements`
--

DROP TABLE IF EXISTS `saved_income_statements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_income_statements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `boarding_house_id` int DEFAULT NULL,
  `is_consolidated` tinyint(1) DEFAULT '0',
  `api_response` json NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_boarding_house_id` (`boarding_house_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_income_statements`
--

LOCK TABLES `saved_income_statements` WRITE;
/*!40000 ALTER TABLE `saved_income_statements` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_income_statements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_account_balances`
--

DROP TABLE IF EXISTS `student_account_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_account_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `enrollment_id` int NOT NULL,
  `current_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'USD',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_enrollment` (`student_id`,`enrollment_id`),
  KEY `idx_balance_student` (`student_id`),
  KEY `idx_balance_enrollment` (`enrollment_id`),
  CONSTRAINT `student_account_balances_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_account_balances_ibfk_2` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_account_balances`
--

LOCK TABLES `student_account_balances` WRITE;
/*!40000 ALTER TABLE `student_account_balances` DISABLE KEYS */;
INSERT INTO `student_account_balances` VALUES (86,137,63,100.00,'USD','2025-11-13 09:36:53','2025-11-13 11:12:38',NULL),(87,140,64,180.00,'USD','2025-11-13 09:37:19','2025-11-13 11:12:38',NULL),(88,153,65,0.00,'USD','2025-11-13 09:37:39','2025-11-13 11:12:38',NULL),(89,169,67,0.00,'USD','2025-11-13 09:37:56','2025-11-13 11:12:38',NULL),(90,143,68,0.00,'USD','2025-11-13 09:38:09','2025-11-13 11:12:38',NULL),(91,186,69,-80.00,'USD','2025-11-13 09:42:04','2025-11-13 11:12:38',NULL),(92,187,70,-20.00,'USD','2025-11-13 09:42:14','2025-11-13 11:12:38',NULL),(93,173,71,-61.00,'USD','2025-11-13 09:42:22','2025-11-13 11:12:38',NULL),(94,184,115,0.00,'USD','2025-11-13 09:42:35','2025-11-13 11:12:38',NULL),(95,142,72,35.00,'USD','2025-11-13 09:42:45','2025-11-13 11:12:38',NULL),(96,181,73,300.00,'USD','2025-11-13 09:42:57','2025-11-13 11:12:38',NULL),(97,160,75,195.00,'USD','2025-11-13 09:43:11','2025-11-13 11:12:38',NULL),(98,189,79,-460.00,'USD','2025-11-13 09:43:32','2025-11-13 11:12:38',NULL),(99,133,118,-20.00,'USD','2025-11-13 09:44:09','2025-11-13 09:44:09',NULL),(100,145,83,30.00,'USD','2025-11-13 09:44:26','2025-11-13 11:12:39',NULL),(101,161,86,0.00,'USD','2025-11-13 09:44:44','2025-11-13 11:12:39',NULL),(102,179,88,160.00,'USD','2025-11-13 09:45:01','2025-11-13 11:12:39',NULL),(103,183,89,190.00,'USD','2025-11-13 09:45:15','2025-11-13 11:12:39',NULL),(104,165,90,133.00,'USD','2025-11-13 09:45:41','2025-11-13 11:12:39',NULL),(105,182,92,360.00,'USD','2025-11-13 09:45:57','2025-11-13 11:12:39',NULL),(106,188,93,-50.00,'USD','2025-11-13 09:46:19','2025-11-13 11:12:39',NULL),(107,156,94,-2.00,'USD','2025-11-13 09:46:30','2025-11-13 11:12:39',NULL),(108,147,96,20.00,'USD','2025-11-13 09:46:50','2025-11-13 11:12:39',NULL),(109,168,97,90.00,'USD','2025-11-13 09:47:03','2025-11-13 11:12:39',NULL),(110,170,98,0.00,'USD','2025-11-13 09:47:11','2025-11-13 11:12:39',NULL),(111,136,99,98.00,'USD','2025-11-13 09:47:20','2025-11-13 11:12:39',NULL),(112,139,101,0.00,'USD','2025-11-13 09:47:42','2025-11-13 11:12:39',NULL),(113,163,103,120.00,'USD','2025-11-13 09:48:02','2025-11-13 11:12:39',NULL),(114,134,104,190.00,'USD','2025-11-13 09:48:13','2025-11-13 11:12:39',NULL),(115,141,106,80.00,'USD','2025-11-13 09:48:47','2025-11-13 11:12:39',NULL),(116,152,107,0.00,'USD','2025-11-13 09:49:56','2025-11-13 11:12:39',NULL),(117,172,108,-10.00,'USD','2025-11-13 09:50:06','2025-11-13 11:12:39',NULL),(118,148,109,10.00,'USD','2025-11-13 09:50:19','2025-11-13 11:12:39',NULL),(119,185,110,0.00,'USD','2025-11-13 09:50:38','2025-11-13 11:12:39',NULL),(120,155,111,0.00,'USD','2025-11-13 09:50:56','2025-11-13 11:12:39',NULL),(121,132,112,0.00,'USD','2025-11-13 09:52:09','2025-11-13 11:12:39',NULL),(122,177,113,0.00,'USD','2025-11-13 09:52:18','2025-11-13 11:12:39',NULL),(123,178,61,0.00,'USD','2025-11-13 10:07:53','2025-11-13 11:12:38',NULL),(124,151,62,0.00,'USD','2025-11-13 10:08:25','2025-11-13 11:12:38',NULL),(125,144,66,0.00,'USD','2025-11-13 10:15:39','2025-11-13 11:12:38',NULL),(126,150,76,0.00,'USD','2025-11-13 10:21:53','2025-11-13 11:12:38',NULL),(127,149,77,0.00,'USD','2025-11-13 10:22:08','2025-11-13 11:12:38',NULL),(128,135,78,0.00,'USD','2025-11-13 10:22:29','2025-11-13 11:12:38',NULL),(129,174,80,0.00,'USD','2025-11-13 10:23:21','2025-11-13 11:12:38',NULL),(130,138,81,0.00,'USD','2025-11-13 10:24:33','2025-11-13 11:12:39',NULL),(131,154,82,0.00,'USD','2025-11-13 10:24:48','2025-11-13 11:12:39',NULL),(132,175,84,0.00,'USD','2025-11-13 10:25:29','2025-11-13 11:12:39',NULL),(133,167,85,0.00,'USD','2025-11-13 10:25:54','2025-11-13 11:12:39',NULL),(134,159,87,0.00,'USD','2025-11-13 10:26:14','2025-11-13 11:12:39',NULL),(135,157,91,0.00,'USD','2025-11-13 10:27:06','2025-11-13 11:12:39',NULL),(136,171,95,-20.00,'USD','2025-11-13 10:29:02','2025-11-13 11:12:39',NULL),(137,146,100,0.00,'USD','2025-11-13 10:34:32','2025-11-13 11:12:39',NULL),(138,162,102,0.00,'USD','2025-11-13 10:37:33','2025-11-13 11:12:39',NULL),(139,158,105,0.00,'USD','2025-11-13 10:38:37','2025-11-13 11:12:39',NULL),(140,176,114,0.00,'USD','2025-11-13 10:42:27','2025-11-13 11:12:39',NULL),(141,193,119,20.00,'USD','2025-11-13 11:14:05','2025-11-13 11:22:43',NULL),(142,194,120,0.00,'USD','2025-11-13 11:21:51','2025-11-13 11:22:24',NULL),(143,180,74,-160.00,'USD','2025-11-13 11:32:12','2025-11-13 11:32:12',NULL);
/*!40000 ALTER TABLE `student_account_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_applications`
--

DROP TABLE IF EXISTS `student_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `medical_history` text,
  `room_id` int NOT NULL,
  `bed_id` int DEFAULT NULL,
  `preferred_move_in_date` date DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relationship` varchar(100) DEFAULT NULL,
  `additional_notes` text,
  `status` enum('pending','approved','rejected','under_review') DEFAULT 'pending',
  `admin_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `national_id` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `address` text,
  `lease_start_date` date DEFAULT NULL,
  `lease_end_date` date DEFAULT NULL,
  `signature_data` longtext,
  PRIMARY KEY (`id`),
  KEY `bed_id` (`bed_id`),
  KEY `idx_applications_status` (`status`),
  KEY `idx_applications_room` (`room_id`),
  KEY `idx_applications_created_at` (`created_at`),
  KEY `idx_applications_national_id` (`national_id`),
  CONSTRAINT `student_applications_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_applications_ibfk_2` FOREIGN KEY (`bed_id`) REFERENCES `beds` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_applications`
--

LOCK TABLES `student_applications` WRITE;
/*!40000 ALTER TABLE `student_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_comments`
--

DROP TABLE IF EXISTS `student_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `author_id` int DEFAULT NULL,
  `content` text,
  `comment_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_comments`
--

LOCK TABLES `student_comments` WRITE;
/*!40000 ALTER TABLE `student_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_documents`
--

DROP TABLE IF EXISTS `student_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_documents`
--

LOCK TABLES `student_documents` WRITE;
/*!40000 ALTER TABLE `student_documents` DISABLE KEYS */;
INSERT INTO `student_documents` VALUES (82,193,'lease_agreement','uploads\\student-documents\\document-1763032445748-754882784.pdf','2025-11-13 11:14:05',NULL),(83,194,'lease_agreement','uploads\\student-documents\\document-1763032911412-599146708.pdf','2025-11-13 11:21:51',NULL);
/*!40000 ALTER TABLE `student_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_enrollments`
--

DROP TABLE IF EXISTS `student_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `expected_end_date` date DEFAULT NULL,
  `agreed_amount` decimal(12,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `notes` text,
  `boarding_house_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `admin_fee` decimal(15,2) DEFAULT '0.00',
  `security_deposit` decimal(15,2) DEFAULT '0.00',
  `checkout_reason` varchar(50) DEFAULT NULL,
  `checkout_notes` text,
  `checkout_checklist` json DEFAULT NULL,
  `checkout_date` date DEFAULT NULL,
  `checkout_status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_enrollments`
--

LOCK TABLES `student_enrollments` WRITE;
/*!40000 ALTER TABLE `student_enrollments` DISABLE KEYS */;
INSERT INTO `student_enrollments` VALUES (61,178,45,'2025-09-01','2025-11-30',160.00,'USD','',10,'2025-11-10 20:54:05',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(62,151,57,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:00:21',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(63,137,51,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:01:10',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(64,140,52,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:03:39',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(65,153,57,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:04:12',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(66,144,46,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:04:51',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(67,169,50,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:05:25',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(68,143,45,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:08:04',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(69,186,50,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:09:10',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(70,187,45,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:09:56',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(71,173,46,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:10:33',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(72,142,59,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:11:13',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(73,181,51,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:12:52',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(74,180,51,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:13:50',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(75,160,46,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:15:35',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(76,150,55,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:16:18',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(77,149,59,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:17:02',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(78,135,58,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:17:50',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(79,189,49,'2025-09-01','2025-12-31',220.00,'USD','',10,'2025-11-10 21:18:26',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(80,174,61,'2025-09-01','2025-12-31',150.00,'USD','',10,'2025-11-10 21:20:06',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(81,138,55,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:23:41',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(82,154,53,'2025-09-01','2025-12-31',170.00,'USD','',10,'2025-11-10 21:24:23',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(83,145,56,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:25:35',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(84,175,59,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:26:27',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(85,167,50,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:27:13',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(86,161,52,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:28:03',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(87,159,60,'2025-09-01','2025-12-31',120.00,'USD','',10,'2025-11-10 21:28:52',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(88,179,45,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:29:30',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(89,183,47,'2025-09-01','2025-12-31',190.00,'USD','',10,'2025-11-10 21:30:11',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(90,165,48,'2025-09-01','2025-12-31',190.00,'USD','',10,'2025-11-10 21:31:57',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(91,157,59,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:32:46',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(92,182,54,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:37:08',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(93,188,59,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:37:58',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(94,156,60,'2025-09-01','2025-12-31',120.00,'USD','',10,'2025-11-10 21:41:44',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(95,171,54,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:42:29',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(96,147,53,'2025-09-01','2025-12-31',170.00,'USD','',10,'2025-11-10 21:43:16',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(97,168,47,'2025-09-01','2025-12-31',190.00,'USD','',10,'2025-11-10 21:44:18',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(98,170,50,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:47:03',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(99,136,58,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:48:12',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(100,146,56,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:48:49',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(101,139,55,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:49:30',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(102,162,46,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:50:39',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(103,163,52,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:51:27',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(104,134,48,'2025-09-01','2025-12-31',190.00,'USD','',10,'2025-11-10 21:52:06',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(105,158,45,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:53:07',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(106,141,50,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:53:48',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(107,152,58,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:54:24',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(108,172,51,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:54:57',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(109,148,53,'2025-09-01','2025-12-31',170.00,'USD','',10,'2025-11-10 21:55:41',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(110,185,46,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:56:40',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(111,155,53,'2025-09-01','2025-12-31',170.00,'USD','',10,'2025-11-10 21:57:30',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(112,132,56,'2025-09-01','2025-12-31',180.00,'USD','',10,'2025-11-10 21:58:21',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(113,177,45,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:59:08',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(114,176,59,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-10 21:59:57',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(115,184,51,'2025-09-01','2025-12-31',160.00,'USD','',10,'2025-11-11 12:35:32',NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL),(116,191,50,'2025-09-01','2025-09-30',160.00,'USD','',10,'2025-11-11 12:49:47','2025-11-13 11:08:22',0.00,0.00,'other','','{\"keys\": {\"notes\": \"\", \"checked\": true}, \"cleaning\": {\"notes\": \"\", \"checked\": true}, \"payments\": {\"notes\": \"\", \"checked\": true}, \"belongings\": {\"notes\": \"\", \"checked\": true}, \"inspection\": {\"notes\": \"\", \"checked\": true}}','2025-09-30',NULL),(117,166,54,'2025-10-01','2025-09-30',180.00,'USD','',10,'2025-11-11 12:51:05','2025-11-13 11:06:00',0.00,0.00,'other','','{\"keys\": {\"notes\": \"\", \"checked\": true}, \"cleaning\": {\"notes\": \"\", \"checked\": true}, \"payments\": {\"notes\": \"\", \"checked\": true}, \"belongings\": {\"notes\": \"\", \"checked\": true}, \"inspection\": {\"notes\": \"\", \"checked\": true}}','2025-09-30',NULL),(118,133,57,'2025-08-31','2025-09-30',180.00,'USD','',10,'2025-11-11 12:51:42','2025-11-13 11:03:41',0.00,0.00,'other','','{\"keys\": {\"notes\": \"\", \"checked\": true}, \"cleaning\": {\"notes\": \"\", \"checked\": true}, \"payments\": {\"notes\": \"\", \"checked\": true}, \"belongings\": {\"notes\": \"\", \"checked\": true}, \"inspection\": {\"notes\": \"\", \"checked\": true}}','2025-09-30',NULL),(119,193,57,'2025-10-01','2025-12-31',180.00,'USD','',10,'2025-11-13 11:14:05',NULL,20.00,0.00,NULL,NULL,NULL,NULL,NULL),(120,194,50,'2025-10-01','2025-12-31',160.00,'USD','',10,'2025-11-13 11:21:51',NULL,20.00,0.00,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `student_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_invoices`
--

DROP TABLE IF EXISTS `student_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `enrollment_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `invoice_date` date NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `status` enum('pending','paid','overdue','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_student` (`student_id`),
  KEY `idx_invoice_enrollment` (`enrollment_id`),
  KEY `idx_invoice_status` (`status`),
  KEY `idx_invoice_date` (`invoice_date`),
  CONSTRAINT `student_invoices_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_invoices_ibfk_2` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=346 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_invoices`
--

LOCK TABLES `student_invoices` WRITE;
/*!40000 ALTER TABLE `student_invoices` DISABLE KEYS */;
INSERT INTO `student_invoices` VALUES (251,137,63,-160.00,'Previous balance (credit) - Anita Gwenda','2025-09-30','PREV-BAL-1763026445998-9szmuejkr','Previous balance adjustment: credit','pending','2025-11-13 09:34:06','2025-11-13 09:34:06',NULL),(252,137,63,-160.00,'Previous balance (credit) - Anita Gwenda','2025-09-30','PREV-BAL-1763026613969-vjfaitl1u','Previous balance adjustment: credit','pending','2025-11-13 09:36:53','2025-11-13 09:56:28',NULL),(253,140,64,-180.00,'Previous balance (credit) - Bellis Mapetere','2025-09-30','PREV-BAL-1763026639609-igfr2g6f3','Previous balance adjustment: credit','pending','2025-11-13 09:37:19','2025-11-13 09:56:28',NULL),(254,153,65,10.00,'Previous balance (debit) - Bertha Majoni','2025-09-30','PREV-BAL-1763026659936-r3x5242e5','Previous balance adjustment: debit','pending','2025-11-13 09:37:39','2025-11-13 09:56:28',NULL),(255,169,67,35.00,'Previous balance (debit) - Chantelle Gora','2025-09-30','PREV-BAL-1763026676054-wronpnj2p','Previous balance adjustment: debit','pending','2025-11-13 09:37:56','2025-11-13 09:56:28',NULL),(256,143,68,80.00,'Previous balance (debit) - Christine Mutsikwa','2025-11-13','PREV-BAL-1763026689204-ysfah8h2w','Previous balance adjustment: debit','pending','2025-11-13 09:38:09','2025-11-13 09:53:59','2025-11-13 09:53:59'),(257,186,69,80.00,'Previous balance (debit) - Dion sengamai','2025-09-30','PREV-BAL-1763026924355-vgmjxz401','Previous balance adjustment: debit','pending','2025-11-13 09:42:04','2025-11-13 09:56:28',NULL),(258,187,70,20.00,'Previous balance (debit) - Emma Yoradin','2025-09-30','PREV-BAL-1763026934425-wdkqim9x6','Previous balance adjustment: debit','pending','2025-11-13 09:42:14','2025-11-13 09:56:28',NULL),(259,173,71,61.00,'Previous balance (debit) - Fadzai Mhizha','2025-09-30','PREV-BAL-1763026942968-mpuolhd4w','Previous balance adjustment: debit','pending','2025-11-13 09:42:22','2025-11-13 09:56:28',NULL),(260,184,115,-40.00,'Previous balance (credit) - Farai Muzembe','2025-09-30','PREV-BAL-1763026955352-dxv77yvng','Previous balance adjustment: credit','pending','2025-11-13 09:42:35','2025-11-13 09:56:28',NULL),(261,142,72,-35.00,'Previous balance (credit) - Fay Mubaiwa','2025-09-30','PREV-BAL-1763026965115-9t0rvwm3m','Previous balance adjustment: credit','pending','2025-11-13 09:42:45','2025-11-13 09:56:28',NULL),(262,181,73,-460.00,'Previous balance (credit) - Grace Vutika','2025-09-30','PREV-BAL-1763026977107-71y3cryut','Previous balance adjustment: credit','pending','2025-11-13 09:42:57','2025-11-13 09:56:28',NULL),(263,160,75,-35.00,'Previous balance (credit) - Kimbely Bones','2025-09-30','PREV-BAL-1763026991872-52litl7yx','Previous balance adjustment: credit','pending','2025-11-13 09:43:11','2025-11-13 09:56:28',NULL),(264,189,79,240.00,'Previous balance (debit) - Kudzai Pemhiwa','2025-09-30','PREV-BAL-1763027012353-4f8vlblw2','Previous balance adjustment: debit','pending','2025-11-13 09:43:32','2025-11-13 09:56:28',NULL),(265,133,118,20.00,'Previous balance (debit) - Leona Dengu','2025-09-30','PREV-BAL-1763027049952-m557259th','Previous balance adjustment: debit','pending','2025-11-13 09:44:09','2025-11-13 09:56:28',NULL),(266,145,83,-30.00,'Previous balance (credit) - Merrylin Makunzva','2025-09-30','PREV-BAL-1763027066847-qde67815e','Previous balance adjustment: credit','pending','2025-11-13 09:44:26','2025-11-13 09:56:28',NULL),(267,161,86,-180.00,'Previous balance (credit) - Natasha Chinho','2025-09-30','PREV-BAL-1763027084718-tyupkwlvk','Previous balance adjustment: credit','pending','2025-11-13 09:44:44','2025-11-13 09:56:28',NULL),(268,179,88,-320.00,'Previous balance (credit) - Paidamoyo Munyimi','2025-09-30','PREV-BAL-1763027101625-khbh5qby3','Previous balance adjustment: credit','pending','2025-11-13 09:45:01','2025-11-13 09:56:28',NULL),(269,183,89,-190.00,'Previous balance (credit) - Pelagia Gomakalila','2025-09-30','PREV-BAL-1763027115957-0zf07z51c','Previous balance adjustment: credit','pending','2025-11-13 09:45:15','2025-11-13 09:56:28',NULL),(270,165,90,-133.00,'Previous balance (credit) - Precious Dziva','2025-09-30','PREV-BAL-1763027141117-j1l05dp8h','Previous balance adjustment: credit','pending','2025-11-13 09:45:41','2025-11-13 09:56:28',NULL),(271,182,92,-540.00,'Previous balance (credit) - Rachel Madembe','2025-09-30','PREV-BAL-1763027157926-envie5c8w','Previous balance adjustment: credit','pending','2025-11-13 09:45:57','2025-11-13 09:56:28',NULL),(272,188,93,30.00,'Previous balance (debit) - Ropafadzo Masara','2025-09-30','PREV-BAL-1763027179527-gjg9iciaa','Previous balance adjustment: debit','pending','2025-11-13 09:46:19','2025-11-13 09:56:28',NULL),(273,156,94,2.00,'Previous balance (debit) - Rumbidzai Manyaora','2025-09-30','PREV-BAL-1763027190280-aa368fzuq','Previous balance adjustment: debit','pending','2025-11-13 09:46:30','2025-11-13 09:56:28',NULL),(274,147,96,-20.00,'Previous balance (credit) - Salina Saidi','2025-09-30','PREV-BAL-1763027210368-znk0remkv','Previous balance adjustment: credit','pending','2025-11-13 09:46:50','2025-11-13 09:56:28',NULL),(275,168,97,-280.00,'Previous balance (credit) - Sandra Chirinda','2025-09-30','PREV-BAL-1763027223475-4wvya1ni1','Previous balance adjustment: credit','pending','2025-11-13 09:47:03','2025-11-13 09:56:28',NULL),(276,170,98,35.00,'Previous balance (debit) - Shalom Gora','2025-09-30','PREV-BAL-1763027231077-g74ppoypp','Previous balance adjustment: debit','pending','2025-11-13 09:47:11','2025-11-13 09:56:28',NULL),(277,136,99,-98.00,'Previous balance (credit) - Shantel Mashe','2025-09-30','PREV-BAL-1763027240598-qsfq4qoy8','Previous balance adjustment: credit','pending','2025-11-13 09:47:20','2025-11-13 09:56:28',NULL),(278,139,101,-98.00,'Previous balance (credit) - Sharon Matanha','2025-09-30','PREV-BAL-1763027262799-2g3ryhh8t','Previous balance adjustment: credit','pending','2025-11-13 09:47:42','2025-11-13 09:56:28',NULL),(279,163,103,-100.00,'Previous balance (credit) - Tadiwa Mhloro','2025-09-30','PREV-BAL-1763027282254-busk93fhm','Previous balance adjustment: credit','pending','2025-11-13 09:48:02','2025-11-13 09:56:28',NULL),(280,134,104,-180.00,'Previous balance (credit) - Takudzwa Makunde','2025-09-30','PREV-BAL-1763027293702-mnqbyexsk','Previous balance adjustment: credit','pending','2025-11-13 09:48:13','2025-11-13 09:56:28',NULL),(281,141,106,-40.00,'Previous balance (credit) - Tatenda Kamatando','2025-09-30','PREV-BAL-1763027327070-74d5oxwmw','Previous balance adjustment: credit','pending','2025-11-13 09:48:47','2025-11-13 09:56:28',NULL),(282,152,107,-180.00,'Previous balance (credit) - Tawana Kuwana','2025-09-30','PREV-BAL-1763027396801-uoq9o7chj','Previous balance adjustment: credit','pending','2025-11-13 09:49:56','2025-11-13 09:56:28',NULL),(283,172,108,-80.00,'Previous balance (credit) - Thelma Nzvimari','2025-09-30','PREV-BAL-1763027406568-ia8dn2eyf','Previous balance adjustment: credit','pending','2025-11-13 09:50:06','2025-11-13 09:56:28',NULL),(284,148,109,-10.00,'Previous balance (credit) - Tinotenda Bwangangwanyo','2025-09-30','PREV-BAL-1763027419084-xeiqi0c3g','Previous balance adjustment: credit','pending','2025-11-13 09:50:19','2025-11-13 09:56:28',NULL),(285,185,110,-20.00,'Previous balance (credit) - Tinotenda Chidavaenzi','2025-09-30','PREV-BAL-1763027438279-kuhcspqel','Previous balance adjustment: credit','pending','2025-11-13 09:50:38','2025-11-13 09:56:28',NULL),(286,155,111,-5.00,'Previous balance (credit) - Tinotenda Magiga','2025-09-30','PREV-BAL-1763027456976-jx0lh2ir3','Previous balance adjustment: credit','pending','2025-11-13 09:50:56','2025-11-13 09:56:28',NULL),(287,132,112,-80.00,'Previous balance (credit) - Trypheane Chinembiri','2025-09-30','PREV-BAL-1763027529675-drjifws3q','Previous balance adjustment: credit','pending','2025-11-13 09:52:09','2025-11-13 09:56:28',NULL),(288,177,113,-5.00,'Previous balance (credit) - Vannessa Magorimbo','2025-09-30','PREV-BAL-1763027538961-xertq8ier','Previous balance adjustment: credit','pending','2025-11-13 09:52:18','2025-11-13 09:56:28',NULL),(289,178,61,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-61','Monthly rent for BUS1 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(290,151,62,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-62','Monthly rent for M6 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(291,137,63,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-63','Monthly rent for EXT2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(292,140,64,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-64','Monthly rent for M1 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(293,153,65,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-65','Monthly rent for M6 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(294,144,66,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-66','Monthly rent for BUS2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(295,169,67,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-67','Monthly rent for EXT1 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(296,143,68,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-68','Monthly rent for BUS1 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(297,186,69,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-69','Monthly rent for EXT1 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(298,187,70,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-70','Monthly rent for BUS1 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(299,173,71,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-71','Monthly rent for BUS2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(300,184,115,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-115','Monthly rent for EXT2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(301,142,72,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-72','Monthly rent for M8 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(302,181,73,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-73','Monthly rent for EXT2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(303,180,74,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-74','Monthly rent for EXT2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(304,160,75,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-75','Monthly rent for BUS2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(305,150,76,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-76','Monthly rent for M4 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(306,149,77,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-77','Monthly rent for M8 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(307,135,78,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-78','Monthly rent for M7 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(308,189,79,220.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-79','Monthly rent for Executive in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(309,174,80,120.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-80','Monthly rent for Upstair 2 in St Kilda','pending','2025-11-13 11:12:38','2025-11-13 11:12:38',NULL),(310,138,81,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-81','Monthly rent for M4 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(311,154,82,170.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-82','Monthly rent for M2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(312,145,83,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-83','Monthly rent for M5 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(313,175,84,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-84','Monthly rent for M8 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(314,167,85,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-85','Monthly rent for EXT1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(315,161,86,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-86','Monthly rent for M1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(316,159,87,150.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-87','Monthly rent for Upstairs 1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(317,179,88,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-88','Monthly rent for BUS1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(318,183,89,190.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-89','Monthly rent for C1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(319,165,90,190.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-90','Monthly rent for C2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(320,157,91,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-91','Monthly rent for M8 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(321,182,92,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-92','Monthly rent for M3 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(322,188,93,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-93','Monthly rent for M8 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(323,156,94,150.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-94','Monthly rent for Upstairs 1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(324,171,95,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-95','Monthly rent for M3 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(325,147,96,170.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-96','Monthly rent for M2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(326,168,97,190.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-97','Monthly rent for C1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(327,170,98,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-98','Monthly rent for EXT1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(328,136,99,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-99','Monthly rent for M7 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(329,146,100,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-100','Monthly rent for M5 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(330,139,101,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-101','Monthly rent for M4 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(331,162,102,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-102','Monthly rent for BUS2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(332,163,103,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-103','Monthly rent for M1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(333,134,104,190.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-104','Monthly rent for C2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(334,158,105,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-105','Monthly rent for BUS1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(335,141,106,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-106','Monthly rent for EXT1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(336,152,107,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-107','Monthly rent for M7 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(337,172,108,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-108','Monthly rent for EXT2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(338,148,109,170.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-109','Monthly rent for M2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(339,185,110,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-110','Monthly rent for BUS2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(340,155,111,170.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-111','Monthly rent for M2 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(341,132,112,180.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-112','Monthly rent for M5 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(342,177,113,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-113','Monthly rent for BUS1 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(343,176,114,160.00,'Monthly Rent - 2025-10','2025-10-01','INV-2025-10-114','Monthly rent for M8 in St Kilda','pending','2025-11-13 11:12:39','2025-11-13 11:12:39',NULL),(344,193,119,200.00,'First month rent + admin fee for November 2025','2025-10-01','INV-1763032445803-u1yfvj5vr','Initial invoice: Monthly rent (USD 180.00) + Admin fee (USD 20.00)','pending','2025-11-13 11:14:05','2025-11-13 11:20:01',NULL),(345,194,120,180.00,'First month rent + admin fee for October 2025','2025-10-01','INV-1763032911495-byhtbeocp','Initial invoice: Monthly rent (USD 160.00) + Admin fee (USD 20.00)','pending','2025-11-13 11:21:51','2025-11-13 11:21:51',NULL);
/*!40000 ALTER TABLE `student_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_payment_schedules`
--

DROP TABLE IF EXISTS `student_payment_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_payment_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `period_start_date` date NOT NULL,
  `period_end_date` date NOT NULL,
  `amount_due` decimal(15,2) NOT NULL,
  `amount_paid` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(3) NOT NULL,
  `status` enum('pending','partial','paid','overdue') DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_payment_schedules_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`id`),
  CONSTRAINT `student_payment_schedules_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_payment_schedules`
--

LOCK TABLES `student_payment_schedules` WRITE;
/*!40000 ALTER TABLE `student_payment_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_payment_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_payments`
--

DROP TABLE IF EXISTS `student_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `enrollment_id` int NOT NULL,
  `schedule_id` int DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('cash_to_admin','cash_to_ba','bank','cash','bank_transfer','mobile_money') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `payment_type` varchar(50) NOT NULL DEFAULT 'monthly_rent',
  `status` varchar(20) NOT NULL DEFAULT 'completed',
  `transaction_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `created_by` (`created_by`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `student_payments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `student_payments_ibfk_5` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_payments`
--

LOCK TABLES `student_payments` WRITE;
/*!40000 ALTER TABLE `student_payments` DISABLE KEYS */;
INSERT INTO `student_payments` VALUES (110,178,61,NULL,160.00,'2025-11-13','cash','BP-21','Branch payment recorded by user 6',6,'2025-11-13 10:07:53','2025-11-13 10:07:53',NULL,'branch_payment','completed',NULL),(111,151,62,NULL,180.00,'2025-11-13','cash','BP-22','Branch payment recorded by user 6',6,'2025-11-13 10:08:25','2025-11-13 10:08:25',NULL,'branch_payment','completed',NULL),(112,137,63,NULL,100.00,'2025-11-13','cash','BP-23','Branch payment recorded by user 6',6,'2025-11-13 10:08:54','2025-11-13 10:08:54',NULL,'branch_payment','completed',NULL),(113,140,64,NULL,180.00,'2025-10-02','cash','BP-24','Branch payment recorded by user 6',6,'2025-11-13 10:14:56','2025-11-13 10:14:56',NULL,'branch_payment','completed',NULL),(114,153,65,NULL,190.00,'2025-10-06','cash','BP-25','Branch payment recorded by user 6',6,'2025-11-13 10:15:20','2025-11-13 10:15:20',NULL,'branch_payment','completed',NULL),(115,144,66,NULL,160.00,'2025-10-13','cash','BP-26','Branch payment recorded by user 6',6,'2025-11-13 10:15:39','2025-11-13 10:15:39',NULL,'branch_payment','completed',NULL),(116,169,67,NULL,160.00,'2025-10-13','cash','BP-27','Branch payment recorded by user 6',6,'2025-11-13 10:16:24','2025-11-13 10:16:24',NULL,'branch_payment','completed',NULL),(117,169,67,NULL,35.00,'2025-10-13','cash','BP-28','Branch payment recorded by user 6',6,'2025-11-13 10:16:40','2025-11-13 10:16:40',NULL,'branch_payment','completed',NULL),(118,143,68,NULL,160.00,'2025-10-06','cash','BP-29','Branch payment recorded by user 6',6,'2025-11-13 10:18:22','2025-11-13 10:18:22',NULL,'branch_payment','completed',NULL),(119,186,69,NULL,160.00,'2025-10-06','cash','BP-30','Branch payment recorded by user 6',6,'2025-11-13 10:18:45','2025-11-13 10:18:45',NULL,'branch_payment','completed',NULL),(120,187,70,NULL,160.00,'2025-11-06','cash','BP-31','Branch payment recorded by user 6',6,'2025-11-13 10:19:06','2025-11-13 10:19:06',NULL,'branch_payment','completed',NULL),(121,173,71,NULL,160.00,'2025-10-01','cash','BP-32','Branch payment recorded by user 6',6,'2025-11-13 10:19:23','2025-11-13 10:19:23',NULL,'branch_payment','completed',NULL),(122,184,115,NULL,120.00,'2025-10-06','cash','BP-33','Branch payment recorded by user 6',6,'2025-11-13 10:19:42','2025-11-13 10:19:42',NULL,'branch_payment','completed',NULL),(123,142,72,NULL,160.00,'2025-10-03','cash','BP-34','Branch payment recorded by user 6',6,'2025-11-13 10:20:00','2025-11-13 10:20:00',NULL,'branch_payment','completed',NULL),(124,160,75,NULL,320.00,'2025-10-01','cash','BP-35','Branch payment recorded by user 6',6,'2025-11-13 10:21:39','2025-11-13 10:21:39',NULL,'branch_payment','completed',NULL),(125,150,76,NULL,180.00,'2025-10-10','cash','BP-36','Branch payment recorded by user 6',6,'2025-11-13 10:21:53','2025-11-13 10:21:53',NULL,'branch_payment','completed',NULL),(126,149,77,NULL,160.00,'2025-10-01','cash','BP-37','Branch payment recorded by user 6',6,'2025-11-13 10:22:08','2025-11-13 10:22:08',NULL,'branch_payment','completed',NULL),(127,135,78,NULL,130.00,'2025-10-02','cash','BP-38','Branch payment recorded by user 6',6,'2025-11-13 10:22:29','2025-11-13 10:22:29',NULL,'branch_payment','completed',NULL),(128,135,78,NULL,50.00,'2025-10-02','cash','BP-39','Branch payment recorded by user 6',6,'2025-11-13 10:22:48','2025-11-13 10:22:48',NULL,'branch_payment','completed',NULL),(129,174,80,NULL,120.00,'2025-10-02','cash','BP-40','Branch payment recorded by user 6',6,'2025-11-13 10:23:21','2025-11-13 10:23:21',NULL,'branch_payment','completed',NULL),(130,138,81,NULL,180.00,'2025-10-02','cash','BP-41','Branch payment recorded by user 6',6,'2025-11-13 10:24:33','2025-11-13 10:24:33',NULL,'branch_payment','completed',NULL),(131,154,82,NULL,170.00,'2025-10-13','cash','BP-42','Branch payment recorded by user 6',6,'2025-11-13 10:24:48','2025-11-13 10:24:48',NULL,'branch_payment','completed',NULL),(132,145,83,NULL,180.00,'2025-10-06','cash','BP-43','Branch payment recorded by user 6',6,'2025-11-13 10:25:06','2025-11-13 10:25:06',NULL,'branch_payment','completed',NULL),(133,175,84,NULL,160.00,'2025-10-01','cash','BP-44','Branch payment recorded by user 6',6,'2025-11-13 10:25:29','2025-11-13 10:25:29',NULL,'branch_payment','completed',NULL),(134,167,85,NULL,160.00,'2025-10-02','cash','BP-45','Branch payment recorded by user 6',6,'2025-11-13 10:25:54','2025-11-13 10:25:54',NULL,'branch_payment','completed',NULL),(135,159,87,NULL,150.00,'2025-10-02','cash','BP-46','Branch payment recorded by user 6',6,'2025-11-13 10:26:14','2025-11-13 10:26:14',NULL,'branch_payment','completed',NULL),(136,183,89,NULL,190.00,'2025-10-02','cash','BP-47','Branch payment recorded by user 6',6,'2025-11-13 10:26:38','2025-11-13 10:26:38',NULL,'branch_payment','completed',NULL),(137,165,90,NULL,190.00,'2025-10-02','cash','BP-48','Branch payment recorded by user 6',6,'2025-11-13 10:26:53','2025-11-13 10:26:53',NULL,'branch_payment','completed',NULL),(138,157,91,NULL,160.00,'2025-10-01','cash','BP-49','Branch payment recorded by user 6',6,'2025-11-13 10:27:06','2025-11-13 10:27:06',NULL,'branch_payment','completed',NULL),(139,188,93,NULL,120.00,'2025-10-06','cash','BP-50','Branch payment recorded by user 6',6,'2025-11-13 10:27:28','2025-11-13 10:27:28',NULL,'branch_payment','completed',NULL),(140,188,93,NULL,20.00,'2025-10-06','cash','BP-51','Branch payment recorded by user 6',6,'2025-11-13 10:27:43','2025-11-13 10:27:43',NULL,'branch_payment','completed',NULL),(141,156,94,NULL,150.00,'2025-10-02','cash','BP-52','Branch payment recorded by user 6',6,'2025-11-13 10:28:06','2025-11-13 10:28:06',NULL,'branch_payment','completed',NULL),(142,171,95,NULL,160.00,'2025-10-06','cash','BP-53','Branch payment recorded by user 6',6,'2025-11-13 10:29:02','2025-11-13 10:29:02',NULL,'branch_payment','completed',NULL),(143,147,96,NULL,170.00,'2025-10-06','cash','BP-54','Branch payment recorded by user 6',6,'2025-11-13 10:29:21','2025-11-13 10:29:21',NULL,'branch_payment','completed',NULL),(144,170,98,NULL,160.00,'2025-10-13','cash','BP-55','Branch payment recorded by user 6',6,'2025-11-13 10:33:36','2025-11-13 10:33:36',NULL,'branch_payment','completed',NULL),(145,170,98,NULL,35.00,'2025-10-13','cash','BP-56','Branch payment recorded by user 6',6,'2025-11-13 10:33:48','2025-11-13 10:33:48',NULL,'branch_payment','completed',NULL),(146,136,99,NULL,180.00,'2025-10-03','cash','BP-57','Branch payment recorded by user 6',6,'2025-11-13 10:34:05','2025-11-13 10:34:05',NULL,'branch_payment','completed',NULL),(147,146,100,NULL,180.00,'2025-10-03','cash','BP-58','Branch payment recorded by user 6',6,'2025-11-13 10:34:32','2025-11-13 10:34:32',NULL,'branch_payment','completed',NULL),(148,139,101,NULL,82.00,'2025-10-02','cash','BP-59','Branch payment recorded by user 6',6,'2025-11-13 10:35:00','2025-11-13 10:35:00',NULL,'branch_payment','completed',NULL),(149,162,102,NULL,160.00,'2025-10-06','cash','BP-60','Branch payment recorded by user 6',6,'2025-11-13 10:37:33','2025-11-13 10:37:33',NULL,'branch_payment','completed',NULL),(150,163,103,NULL,200.00,'2025-10-13','cash','BP-61','Branch payment recorded by user 6',6,'2025-11-13 10:37:55','2025-11-13 10:37:55',NULL,'branch_payment','completed',NULL),(151,134,104,NULL,200.00,'2025-10-03','cash','BP-62','Branch payment recorded by user 6',6,'2025-11-13 10:38:21','2025-11-13 10:38:21',NULL,'branch_payment','completed',NULL),(152,158,105,NULL,160.00,'2025-10-01','cash','BP-63','Branch payment recorded by user 6',6,'2025-11-13 10:38:37','2025-11-13 10:38:37',NULL,'branch_payment','completed',NULL),(153,141,106,NULL,200.00,'2025-10-03','cash','BP-64','Branch payment recorded by user 6',6,'2025-11-13 10:39:27','2025-11-13 10:39:27',NULL,'branch_payment','completed',NULL),(154,172,108,NULL,60.00,'2025-10-06','cash','BP-65','Branch payment recorded by user 6',6,'2025-11-13 10:39:53','2025-11-13 10:39:53',NULL,'branch_payment','completed',NULL),(155,172,108,NULL,10.00,'2025-10-06','cash','BP-66','Branch payment recorded by user 6',6,'2025-11-13 10:40:04','2025-11-13 10:40:04',NULL,'branch_payment','completed',NULL),(156,148,109,NULL,170.00,'2025-10-06','cash','BP-67','Branch payment recorded by user 6',6,'2025-11-13 10:40:25','2025-11-13 10:40:25',NULL,'branch_payment','completed',NULL),(157,185,110,NULL,140.00,'2025-10-03','cash','BP-68','Branch payment recorded by user 6',6,'2025-11-13 10:40:41','2025-11-13 10:40:41',NULL,'branch_payment','completed',NULL),(158,155,111,NULL,165.00,'2025-10-16','cash','BP-69','Branch payment recorded by user 6',6,'2025-11-13 10:41:04','2025-11-13 10:41:04',NULL,'branch_payment','completed',NULL),(159,132,112,NULL,100.00,'2025-10-20','cash','BP-70','Branch payment recorded by user 6',6,'2025-11-13 10:41:20','2025-11-13 10:41:20',NULL,'branch_payment','completed',NULL),(160,177,113,NULL,125.00,'2025-10-10','cash','BP-71','Branch payment recorded by user 6',6,'2025-11-13 10:41:34','2025-11-13 10:41:34',NULL,'branch_payment','completed',NULL),(161,177,113,NULL,30.00,'2025-10-10','cash','BP-72','Branch payment recorded by user 6',6,'2025-11-13 10:41:47','2025-11-13 10:41:47',NULL,'branch_payment','completed',NULL),(162,176,114,NULL,160.00,'2025-10-01','cash','BP-73','Branch payment recorded by user 6',6,'2025-11-13 10:42:27','2025-11-13 10:42:27',NULL,'branch_payment','completed',NULL),(163,194,120,NULL,180.00,'2025-10-03','cash','BP-74','Branch payment recorded by user 6',6,'2025-11-13 11:22:24','2025-11-13 11:22:24',NULL,'branch_payment','completed',NULL),(164,193,119,NULL,220.00,'2025-10-02','cash','BP-75','Branch payment recorded by user 6',6,'2025-11-13 11:22:43','2025-11-13 11:22:43',NULL,'branch_payment','completed',NULL);
/*!40000 ALTER TABLE `student_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `student_number` varchar(100) DEFAULT NULL,
  `national_id` varchar(100) DEFAULT NULL,
  `university` varchar(255) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `address` text,
  `phone_number` varchar(50) DEFAULT NULL,
  `boarding_house_id` int DEFAULT NULL,
  `joined_at` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_number` (`student_number`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `idx_students_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=195 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (132,'STU0001',NULL,'Trypheane Chinembiri','STU1760962761194DOGU1',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:21',NULL),(133,'STU0002',NULL,'Leona Dengu','STU1760962763398U1KM8','29-2098334N834416',NULL,'Female',NULL,NULL,1,NULL,'Inactive','2025-10-20 10:19:24',NULL),(134,'STU0003',NULL,'Takudzwa Makunde','STU1760962765610FXJUS',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:26',NULL),(135,'STU0004',NULL,'Kudzai Matare','STU176096276777331G2Q',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:28',NULL),(136,'STU0005',NULL,'Shantel Mashe','STU17609627699615N2PV',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:30',NULL),(137,'STU0006',NULL,'Anita Gwenda','STU17609627724570AQLE',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:33',NULL),(138,'STU0007',NULL,'Lillian Chatikobo','STU1760962774688VOLXB',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:35',NULL),(139,'STU0008',NULL,'Sharon Matanha','STU1760962776868TSNI8',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:37',NULL),(140,'STU0009',NULL,'Bellis Mapetere','STU17609627790139NZYH',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:39',NULL),(141,'STU0010',NULL,'Tatenda Kamatando','STU1760962781642B2MWL',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:42',NULL),(142,'STU0011',NULL,'Fay Mubaiwa','STU1760962783907PI7JB',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:44',NULL),(143,'STU0012',NULL,'Christine Mutsikwa','STU1760962786345J2RTN',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:47',NULL),(144,'STU0013',NULL,'Bertha Mwangu','STU1760962788794ET3FG',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:49',NULL),(145,'STU0014',NULL,'Merrylin Makunzva','STU1760962791001W3AT1',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:51',NULL),(146,'STU0015',NULL,'Shantell Mawarira','STU1760962793219489KK','265373',NULL,'Female',NULL,NULL,1,NULL,'Active','2025-10-20 10:19:53',NULL),(147,'STU0016',NULL,'Salina Saidi','STU1760962795388DH9YR',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:19:56',NULL),(148,'STU0017',NULL,'Tinotenda Bwangangwanyo','STU17609628012495MDF9',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:02',NULL),(149,'STU0018',NULL,'Kimberly Nkomo','STU1760962803454I0UZC',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:04',NULL),(150,'STU0019',NULL,'Kimberly Mutowembwa','STU1760962805614O623S',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:06',NULL),(151,'STU0020',NULL,'Alicia Mutamuko','STU176096280780299YTD',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:08',NULL),(152,'STU0021',NULL,'Tawana Kuwana','STU1760962810052MUCBN',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:10',NULL),(153,'STU0022',NULL,'Bertha Majoni','STU1760962812295S8ZWX',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:13',NULL),(154,'STU0023',NULL,'Lorraine Mlambo','STU1760962814468SKHTH',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:15',NULL),(155,'STU0024',NULL,'Tinotenda Magiga','STU1760962816848XZ298',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:17',NULL),(156,'STU0025',NULL,'Rumbidzai Manyaora','STU1760962819438IPZ9G',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:20',NULL),(157,'STU0026',NULL,'Precious Mashava','STU1760962822021M8ZV0',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:22',NULL),(158,'STU0027',NULL,'Tanaka Chikonyera','STU17609628257227HNEX',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:26',NULL),(159,'STU0028',NULL,'Nyashadzashe Chinorwiwa','STU1760962833735YN6U9',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:34',NULL),(160,'STU0029',NULL,'Kimbely Bones','STU1760962835941WQBDT',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:36',NULL),(161,'STU0030',NULL,'Natasha Chinho','STU1760962838175BWH4Y',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:38',NULL),(162,'STU0031',NULL,'Tadiwa','STU17609628404214ULZP',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:41',NULL),(163,'STU0032',NULL,'Tadiwa Mhloro','STU1760962842734VNFAY',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:43',NULL),(164,'STU0033',NULL,'Varaidzo Tafirei','STU1760962844967S7HC1',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:45','2025-10-29 06:35:57'),(165,'STU0034',NULL,'Precious Dziva','STU1760962847226PZC7R',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:47',NULL),(166,'STU0035',NULL,'Shelter Masosonere','STU17609628494125URML','29-2098334N834416ee',NULL,'Female',NULL,NULL,10,NULL,'Inactive','2025-10-20 10:20:50',NULL),(167,'STU0036',NULL,'Munashe','STU176096285167165SEY',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:52',NULL),(168,'STU0037',NULL,'Sandra Chirinda','STU1760962853861DEPVB',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:54',NULL),(169,'STU0038',NULL,'Chantelle Gora','STU17609628560369TDAW',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:56',NULL),(170,'STU0039',NULL,'Shalom Gora','STU17609628584921RMVM',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:20:59',NULL),(171,'STU0040',NULL,'Ruvimbo Singe','STU17609628607551SZVI',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:01',NULL),(172,'STU0041',NULL,'Thelma Nzvimari','STU1760962862940D9KKV',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:03',NULL),(173,'STU0042',NULL,'Fadzai Mhizha','STU1760962865732N5WCH',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:06',NULL),(174,'STU0043',NULL,'Kuziwa','STU1760962868247IGJS1',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:09',NULL),(175,'STU0044',NULL,'Mitchel Chikosha','STU1760962870632N20AL',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:11',NULL),(176,'STU0045',NULL,'Vimbai','STU1760962872797HK7EW',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:13',NULL),(177,'STU0046',NULL,'Vannessa Magorimbo','STU1760962875019XKEVH',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:15',NULL),(178,'STU0047',NULL,'Agape Chiware','STU1760962877180YU124','29-2098334N834416',NULL,'Female',NULL,NULL,10,NULL,'Active','2025-10-20 10:21:17',NULL),(179,'STU0048',NULL,'Paidamoyo Munyimi','STU1760962879348SLKD6',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:20',NULL),(180,'STU0049',NULL,'Gracious','STU1760962881589ION2O',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:22',NULL),(181,'STU0050',NULL,'Grace Vutika','STU1760962884108RVJ35',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:24',NULL),(182,'STU0051',NULL,'Rachel Madembe','STU1760962886296VBEH3',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:27',NULL),(183,'STU0052',NULL,'Pelagia Gomakalila','STU1760962888528HK4W8',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:29',NULL),(184,'STU0053',NULL,'Farai Muzembe','STU176096289073245JBV',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:31',NULL),(185,'STU0054',NULL,'Tinotenda Chidavaenzi','STU17609628929259V153',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:33',NULL),(186,'STU0055',NULL,'Dion sengamai','STU1760962895088JBB6M',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:35',NULL),(187,'STU0056',NULL,'Emma Yoradin','STU1760962897266PQJGR',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:38',NULL),(188,'STU0057',NULL,'Ropafadzo Masara','STU1760962899449VP97H',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:40',NULL),(189,'STU0058',NULL,'Kudzai Pemhiwa','STU1760962901944M2Y8X',NULL,NULL,NULL,NULL,NULL,1,NULL,'Active','2025-10-20 10:21:42',NULL),(190,'STU847720',NULL,'Kudzai Vella',NULL,'29-2098334N834416f','University of Zimbabwe','Female','6334 southview','0771472707',10,'2025-11-11','Inactive','2025-11-11 12:47:16',NULL),(191,'STU992871',NULL,'Varaidzo Tafirei',NULL,'29-2098334N83441678','University of Zimbabwe','Female',NULL,NULL,10,'2025-11-11','Inactive','2025-11-11 12:48:42',NULL),(192,'STU847884',NULL,'Tanyaradzwa Manife',NULL,'29-2098334N834416GH','University of Zimbabwe','Female','6334 southview','0771472707',10,'2025-11-11','Inactive','2025-11-11 13:11:15',NULL),(193,'STU828080',NULL,'Tanaka Matematema',NULL,'29-2098334N834416edd',NULL,'Female','6334 southview','0771472707',10,'2025-11-13','Active','2025-11-13 11:13:20',NULL),(194,'STU547303',NULL,'Sharmaine Tinarwo',NULL,'29-2098334N834416YUO',NULL,'Female','6334 southview','0771472707',10,'2025-11-13','Active','2025-11-13 11:21:14',NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('cash','petty_cash','bank_transfer','check','mobile_money','other') DEFAULT 'cash',
  `petty_cash_account_id` int DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `description` text,
  `notes` text,
  `expense_id` int DEFAULT NULL,
  `boarding_house_id` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_supplier_payments_supplier` (`supplier_id`),
  KEY `idx_supplier_payments_date` (`payment_date`),
  KEY `idx_supplier_payments_boarding_house` (`boarding_house_id`),
  KEY `idx_supplier_payments_deleted` (`deleted_at`),
  KEY `expense_id` (`expense_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_supplier_payments_petty_cash` (`petty_cash_account_id`),
  CONSTRAINT `supplier_payments_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_payments_ibfk_2` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_ibfk_3` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_payments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `category` varchar(100) DEFAULT 'General',
  `status` enum('active','inactive') DEFAULT 'active',
  `boarding_house_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_suppliers_company` (`company`),
  KEY `idx_suppliers_category` (`category`),
  KEY `idx_suppliers_status` (`status`),
  KEY `idx_suppliers_boarding_house` (`boarding_house_id`),
  CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_rules`
--

DROP TABLE IF EXISTS `transaction_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_type` varchar(50) DEFAULT NULL,
  `debit_account_id` int DEFAULT NULL,
  `credit_account_id` int DEFAULT NULL,
  `auto_post` tinyint(1) DEFAULT '0',
  `notes` text,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_rules_ibfk_1` (`debit_account_id`),
  KEY `transaction_rules_ibfk_2` (`credit_account_id`),
  CONSTRAINT `transaction_rules_ibfk_1` FOREIGN KEY (`debit_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `transaction_rules_ibfk_2` FOREIGN KEY (`credit_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_rules`
--

LOCK TABLES `transaction_rules` WRITE;
/*!40000 ALTER TABLE `transaction_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_type` varchar(50) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `boarding_house_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','posted','voided') DEFAULT 'posted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=611 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (415,'previous_balance',137,'PREV-BAL-1763026445998-9szmuejkr',160.00,'USD','Previous balance adjustment - Anita Gwenda (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:34:05',NULL,'posted'),(416,'previous_balance',137,'PREV-BAL-1763026613969-vjfaitl1u',160.00,'USD','Previous balance adjustment - Anita Gwenda (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:36:53',NULL,'posted'),(417,'previous_balance',140,'PREV-BAL-1763026639609-igfr2g6f3',180.00,'USD','Previous balance adjustment - Bellis Mapetere (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:37:19',NULL,'posted'),(418,'previous_balance',153,'PREV-BAL-1763026659936-r3x5242e5',10.00,'USD','Previous balance adjustment - Bertha Majoni (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:37:39',NULL,'posted'),(419,'previous_balance',169,'PREV-BAL-1763026676054-wronpnj2p',35.00,'USD','Previous balance adjustment - Chantelle Gora (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:37:56',NULL,'posted'),(420,'previous_balance',143,'PREV-BAL-1763026689204-ysfah8h2w',80.00,'USD','Previous balance adjustment - Christine Mutsikwa (debit)','2025-11-12 22:00:00',10,6,'2025-11-13 09:38:09','2025-11-13 09:53:59','posted'),(421,'previous_balance',186,'PREV-BAL-1763026924355-vgmjxz401',80.00,'USD','Previous balance adjustment - Dion sengamai (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:42:04',NULL,'posted'),(422,'previous_balance',187,'PREV-BAL-1763026934425-wdkqim9x6',20.00,'USD','Previous balance adjustment - Emma Yoradin (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:42:14',NULL,'posted'),(423,'previous_balance',173,'PREV-BAL-1763026942968-mpuolhd4w',61.00,'USD','Previous balance adjustment - Fadzai Mhizha (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:42:22',NULL,'posted'),(424,'previous_balance',184,'PREV-BAL-1763026955352-dxv77yvng',40.00,'USD','Previous balance adjustment - Farai Muzembe (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:42:35',NULL,'posted'),(425,'previous_balance',142,'PREV-BAL-1763026965115-9t0rvwm3m',35.00,'USD','Previous balance adjustment - Fay Mubaiwa (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:42:45',NULL,'posted'),(426,'previous_balance',181,'PREV-BAL-1763026977107-71y3cryut',460.00,'USD','Previous balance adjustment - Grace Vutika (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:42:57',NULL,'posted'),(427,'previous_balance',160,'PREV-BAL-1763026991872-52litl7yx',35.00,'USD','Previous balance adjustment - Kimbely Bones (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:43:11',NULL,'posted'),(428,'previous_balance',189,'PREV-BAL-1763027012353-4f8vlblw2',240.00,'USD','Previous balance adjustment - Kudzai Pemhiwa (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:43:32',NULL,'posted'),(429,'previous_balance',133,'PREV-BAL-1763027049952-m557259th',20.00,'USD','Previous balance adjustment - Leona Dengu (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:44:09',NULL,'posted'),(430,'previous_balance',145,'PREV-BAL-1763027066847-qde67815e',30.00,'USD','Previous balance adjustment - Merrylin Makunzva (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:44:26',NULL,'posted'),(431,'previous_balance',161,'PREV-BAL-1763027084718-tyupkwlvk',180.00,'USD','Previous balance adjustment - Natasha Chinho (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:44:44',NULL,'posted'),(432,'previous_balance',179,'PREV-BAL-1763027101625-khbh5qby3',320.00,'USD','Previous balance adjustment - Paidamoyo Munyimi (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:45:01',NULL,'posted'),(433,'previous_balance',183,'PREV-BAL-1763027115957-0zf07z51c',190.00,'USD','Previous balance adjustment - Pelagia Gomakalila (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:45:15',NULL,'posted'),(434,'previous_balance',165,'PREV-BAL-1763027141117-j1l05dp8h',133.00,'USD','Previous balance adjustment - Precious Dziva (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:45:41',NULL,'posted'),(435,'previous_balance',182,'PREV-BAL-1763027157926-envie5c8w',540.00,'USD','Previous balance adjustment - Rachel Madembe (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:45:57',NULL,'posted'),(436,'previous_balance',188,'PREV-BAL-1763027179527-gjg9iciaa',30.00,'USD','Previous balance adjustment - Ropafadzo Masara (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:46:19',NULL,'posted'),(437,'previous_balance',156,'PREV-BAL-1763027190280-aa368fzuq',2.00,'USD','Previous balance adjustment - Rumbidzai Manyaora (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:46:30',NULL,'posted'),(438,'previous_balance',147,'PREV-BAL-1763027210368-znk0remkv',20.00,'USD','Previous balance adjustment - Salina Saidi (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:46:50',NULL,'posted'),(439,'previous_balance',168,'PREV-BAL-1763027223475-4wvya1ni1',280.00,'USD','Previous balance adjustment - Sandra Chirinda (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:47:03',NULL,'posted'),(440,'previous_balance',170,'PREV-BAL-1763027231077-g74ppoypp',35.00,'USD','Previous balance adjustment - Shalom Gora (debit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:47:11',NULL,'posted'),(441,'previous_balance',136,'PREV-BAL-1763027240598-qsfq4qoy8',98.00,'USD','Previous balance adjustment - Shantel Mashe (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:47:20',NULL,'posted'),(442,'previous_balance',139,'PREV-BAL-1763027262799-2g3ryhh8t',98.00,'USD','Previous balance adjustment - Sharon Matanha (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:47:42',NULL,'posted'),(443,'previous_balance',163,'PREV-BAL-1763027282254-busk93fhm',100.00,'USD','Previous balance adjustment - Tadiwa Mhloro (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:48:02',NULL,'posted'),(444,'previous_balance',134,'PREV-BAL-1763027293702-mnqbyexsk',180.00,'USD','Previous balance adjustment - Takudzwa Makunde (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:48:13',NULL,'posted'),(445,'previous_balance',141,'PREV-BAL-1763027327070-74d5oxwmw',40.00,'USD','Previous balance adjustment - Tatenda Kamatando (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:48:47',NULL,'posted'),(446,'previous_balance',152,'PREV-BAL-1763027396801-uoq9o7chj',180.00,'USD','Previous balance adjustment - Tawana Kuwana (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:49:56',NULL,'posted'),(447,'previous_balance',172,'PREV-BAL-1763027406568-ia8dn2eyf',80.00,'USD','Previous balance adjustment - Thelma Nzvimari (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:50:06',NULL,'posted'),(448,'previous_balance',148,'PREV-BAL-1763027419084-xeiqi0c3g',10.00,'USD','Previous balance adjustment - Tinotenda Bwangangwanyo (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:50:19',NULL,'posted'),(449,'previous_balance',185,'PREV-BAL-1763027438279-kuhcspqel',20.00,'USD','Previous balance adjustment - Tinotenda Chidavaenzi (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:50:38',NULL,'posted'),(450,'previous_balance',155,'PREV-BAL-1763027456976-jx0lh2ir3',5.00,'USD','Previous balance adjustment - Tinotenda Magiga (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:50:56',NULL,'posted'),(451,'previous_balance',132,'PREV-BAL-1763027529675-drjifws3q',80.00,'USD','Previous balance adjustment - Trypheane Chinembiri (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:52:09',NULL,'posted'),(452,'previous_balance',177,'PREV-BAL-1763027538961-xertq8ier',5.00,'USD','Previous balance adjustment - Vannessa Magorimbo (credit)','2025-09-29 22:00:00',10,6,'2025-11-13 09:52:18',NULL,'posted'),(453,'beginning_balance',NULL,'PC-24-1763028100595',21.08,'USD','Initial balance for mako','2025-09-29 22:00:00',10,6,'2025-11-13 10:01:40',NULL,'posted'),(454,'opening_balance_set',NULL,'OB-1763028141689',2598.55,'USD','Opening Balance Set: Initial balance','2025-09-29 22:00:00',10,6,'2025-11-13 10:02:21',NULL,'posted'),(455,'opening_balance_set',NULL,'OB-1763028176172',150.35,'USD','Opening Balance Set: Initial balance','2025-09-29 22:00:00',10,6,'2025-11-13 10:02:56',NULL,'posted'),(456,'opening_balance_set',NULL,'OB-1763028211344',150.35,'USD','Opening Balance Set: Initial balance','2025-09-29 22:00:00',10,6,'2025-11-13 10:03:31',NULL,'posted'),(457,'opening_balance_set',NULL,'OB-1763028263322',2598.55,'USD','Opening Balance Set: Initial balance','2025-09-29 22:00:00',10,6,'2025-11-13 10:04:23',NULL,'posted'),(458,'opening_balance_set',NULL,'OB-1763028284348',1280.00,'USD','Opening Balance Set: Initial balance','2025-09-29 22:00:00',10,6,'2025-11-13 10:04:44',NULL,'posted'),(459,'branch_payment',NULL,'BP-21',160.00,NULL,'Branch Payment - Student 178','2025-10-01 22:00:00',10,6,'2025-11-13 10:07:53',NULL,'posted'),(460,'branch_payment',NULL,'BP-22',180.00,NULL,'Branch Payment - Student 151','2025-10-01 22:00:00',10,6,'2025-11-13 10:08:25',NULL,'posted'),(461,'branch_payment',NULL,'BP-23',100.00,NULL,'Branch Payment - Student 137','2025-10-01 22:00:00',10,6,'2025-11-13 10:08:54',NULL,'posted'),(462,'branch_payment',NULL,'BP-24',180.00,NULL,'Branch Payment - Student 140','2025-10-01 22:00:00',10,6,'2025-11-13 10:14:56',NULL,'posted'),(463,'branch_payment',NULL,'BP-25',190.00,NULL,'Branch Payment - Student 153','2025-10-05 22:00:00',10,6,'2025-11-13 10:15:20',NULL,'posted'),(464,'branch_payment',NULL,'BP-26',160.00,NULL,'Branch Payment - Student 144','2025-10-12 22:00:00',10,6,'2025-11-13 10:15:39',NULL,'posted'),(465,'branch_payment',NULL,'BP-27',160.00,NULL,'Branch Payment - Student 169','2025-10-12 22:00:00',10,6,'2025-11-13 10:16:24',NULL,'posted'),(466,'branch_payment',NULL,'BP-28',35.00,NULL,'Branch Payment - Student 169','2025-10-12 22:00:00',10,6,'2025-11-13 10:16:40',NULL,'posted'),(467,'branch_payment',NULL,'BP-29',160.00,NULL,'Branch Payment - Student 143','2025-10-05 22:00:00',10,6,'2025-11-13 10:18:22',NULL,'posted'),(468,'branch_payment',NULL,'BP-30',160.00,NULL,'Branch Payment - Student 186','2025-10-05 22:00:00',10,6,'2025-11-13 10:18:45',NULL,'posted'),(469,'branch_payment',NULL,'BP-31',160.00,NULL,'Branch Payment - Student 187','2025-10-05 22:00:00',10,6,'2025-11-13 10:19:06',NULL,'posted'),(470,'branch_payment',NULL,'BP-32',160.00,NULL,'Branch Payment - Student 173','2025-09-30 22:00:00',10,6,'2025-11-13 10:19:23',NULL,'posted'),(471,'branch_payment',NULL,'BP-33',120.00,NULL,'Branch Payment - Student 184','2025-10-05 22:00:00',10,6,'2025-11-13 10:19:42',NULL,'posted'),(472,'branch_payment',NULL,'BP-34',160.00,NULL,'Branch Payment - Student 142','2025-10-02 22:00:00',10,6,'2025-11-13 10:20:00',NULL,'posted'),(473,'branch_payment',NULL,'BP-35',320.00,NULL,'Branch Payment - Student 160','2025-09-30 22:00:00',10,6,'2025-11-13 10:21:39',NULL,'posted'),(474,'branch_payment',NULL,'BP-36',180.00,NULL,'Branch Payment - Student 150','2025-10-09 22:00:00',10,6,'2025-11-13 10:21:53',NULL,'posted'),(475,'branch_payment',NULL,'BP-37',160.00,NULL,'Branch Payment - Student 149','2025-09-30 22:00:00',10,6,'2025-11-13 10:22:08',NULL,'posted'),(476,'branch_payment',NULL,'BP-38',130.00,NULL,'Branch Payment - Student 135','2025-10-01 22:00:00',10,6,'2025-11-13 10:22:29',NULL,'posted'),(477,'branch_payment',NULL,'BP-39',50.00,NULL,'Branch Payment - Student 135','2025-10-01 22:00:00',10,6,'2025-11-13 10:22:48',NULL,'posted'),(478,'branch_payment',NULL,'BP-40',120.00,NULL,'Branch Payment - Student 174','2025-10-01 22:00:00',10,6,'2025-11-13 10:23:20',NULL,'posted'),(479,'branch_payment',NULL,'BP-41',180.00,NULL,'Branch Payment - Student 138','2025-10-01 22:00:00',10,6,'2025-11-13 10:24:33',NULL,'posted'),(480,'branch_payment',NULL,'BP-42',170.00,NULL,'Branch Payment - Student 154','2025-10-12 22:00:00',10,6,'2025-11-13 10:24:48',NULL,'posted'),(481,'branch_payment',NULL,'BP-43',180.00,NULL,'Branch Payment - Student 145','2025-10-05 22:00:00',10,6,'2025-11-13 10:25:06',NULL,'posted'),(482,'branch_payment',NULL,'BP-44',160.00,NULL,'Branch Payment - Student 175','2025-09-30 22:00:00',10,6,'2025-11-13 10:25:29',NULL,'posted'),(483,'branch_payment',NULL,'BP-45',160.00,NULL,'Branch Payment - Student 167','2025-10-01 22:00:00',10,6,'2025-11-13 10:25:54',NULL,'posted'),(484,'branch_payment',NULL,'BP-46',150.00,NULL,'Branch Payment - Student 159','2025-10-01 22:00:00',10,6,'2025-11-13 10:26:14',NULL,'posted'),(485,'branch_payment',NULL,'BP-47',190.00,NULL,'Branch Payment - Student 183','2025-10-01 22:00:00',10,6,'2025-11-13 10:26:38',NULL,'posted'),(486,'branch_payment',NULL,'BP-48',190.00,NULL,'Branch Payment - Student 165','2025-10-01 22:00:00',10,6,'2025-11-13 10:26:53',NULL,'posted'),(487,'branch_payment',NULL,'BP-49',160.00,NULL,'Branch Payment - Student 157','2025-09-30 22:00:00',10,6,'2025-11-13 10:27:06',NULL,'posted'),(488,'branch_payment',NULL,'BP-50',120.00,NULL,'Branch Payment - Student 188','2025-10-05 22:00:00',10,6,'2025-11-13 10:27:28',NULL,'posted'),(489,'branch_payment',NULL,'BP-51',20.00,NULL,'Branch Payment - Student 188','2025-10-05 22:00:00',10,6,'2025-11-13 10:27:43',NULL,'posted'),(490,'branch_payment',NULL,'BP-52',150.00,NULL,'Branch Payment - Student 156','2025-10-01 22:00:00',10,6,'2025-11-13 10:28:06',NULL,'posted'),(491,'branch_payment',NULL,'BP-53',160.00,NULL,'Branch Payment - Student 171','2025-10-05 22:00:00',10,6,'2025-11-13 10:29:02',NULL,'posted'),(492,'branch_payment',NULL,'BP-54',170.00,NULL,'Branch Payment - Student 147','2025-10-05 22:00:00',10,6,'2025-11-13 10:29:21',NULL,'posted'),(493,'branch_payment',NULL,'BP-55',160.00,NULL,'Branch Payment - Student 170','2025-10-12 22:00:00',10,6,'2025-11-13 10:33:36',NULL,'posted'),(494,'branch_payment',NULL,'BP-56',35.00,NULL,'Branch Payment - Student 170','2025-10-12 22:00:00',10,6,'2025-11-13 10:33:48',NULL,'posted'),(495,'branch_payment',NULL,'BP-57',180.00,NULL,'Branch Payment - Student 136','2025-10-02 22:00:00',10,6,'2025-11-13 10:34:05',NULL,'posted'),(496,'branch_payment',NULL,'BP-58',180.00,NULL,'Branch Payment - Student 146','2025-10-02 22:00:00',10,6,'2025-11-13 10:34:32',NULL,'posted'),(497,'branch_payment',NULL,'BP-59',82.00,NULL,'Branch Payment - Student 139','2025-10-01 22:00:00',10,6,'2025-11-13 10:35:00',NULL,'posted'),(498,'branch_payment',NULL,'BP-60',160.00,NULL,'Branch Payment - Student 162','2025-10-05 22:00:00',10,6,'2025-11-13 10:37:33',NULL,'posted'),(499,'branch_payment',NULL,'BP-61',200.00,NULL,'Branch Payment - Student 163','2025-10-12 22:00:00',10,6,'2025-11-13 10:37:55',NULL,'posted'),(500,'branch_payment',NULL,'BP-62',200.00,NULL,'Branch Payment - Student 134','2025-10-02 22:00:00',10,6,'2025-11-13 10:38:21',NULL,'posted'),(501,'branch_payment',NULL,'BP-63',160.00,NULL,'Branch Payment - Student 158','2025-09-30 22:00:00',10,6,'2025-11-13 10:38:37',NULL,'posted'),(502,'branch_payment',NULL,'BP-64',200.00,NULL,'Branch Payment - Student 141','2025-10-02 22:00:00',10,6,'2025-11-13 10:39:27',NULL,'posted'),(503,'branch_payment',NULL,'BP-65',60.00,NULL,'Branch Payment - Student 172','2025-10-05 22:00:00',10,6,'2025-11-13 10:39:53',NULL,'posted'),(504,'branch_payment',NULL,'BP-66',10.00,NULL,'Branch Payment - Student 172','2025-10-05 22:00:00',10,6,'2025-11-13 10:40:04',NULL,'posted'),(505,'branch_payment',NULL,'BP-67',170.00,NULL,'Branch Payment - Student 148','2025-10-05 22:00:00',10,6,'2025-11-13 10:40:25',NULL,'posted'),(506,'branch_payment',NULL,'BP-68',140.00,NULL,'Branch Payment - Student 185','2025-10-02 22:00:00',10,6,'2025-11-13 10:40:41',NULL,'posted'),(507,'branch_payment',NULL,'BP-69',165.00,NULL,'Branch Payment - Student 155','2025-10-15 22:00:00',10,6,'2025-11-13 10:41:04',NULL,'posted'),(508,'branch_payment',NULL,'BP-70',100.00,NULL,'Branch Payment - Student 132','2025-10-19 22:00:00',10,6,'2025-11-13 10:41:20',NULL,'posted'),(509,'branch_payment',NULL,'BP-71',125.00,NULL,'Branch Payment - Student 177','2025-10-09 22:00:00',10,6,'2025-11-13 10:41:34',NULL,'posted'),(510,'branch_payment',NULL,'BP-72',30.00,NULL,'Branch Payment - Student 177','2025-10-09 22:00:00',10,6,'2025-11-13 10:41:47',NULL,'posted'),(511,'branch_payment',NULL,'BP-73',160.00,NULL,'Branch Payment - Student 176','2025-09-30 22:00:00',10,6,'2025-11-13 10:42:27',NULL,'posted'),(512,'monthly_invoice',178,'INV-2025-10-61',160.00,'USD','Monthly invoice - Agape Chiware - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(513,'monthly_invoice',151,'INV-2025-10-62',180.00,'USD','Monthly invoice - Alicia Mutamuko - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(514,'monthly_invoice',137,'INV-2025-10-63',160.00,'USD','Monthly invoice - Anita Gwenda - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(515,'monthly_invoice',140,'INV-2025-10-64',180.00,'USD','Monthly invoice - Bellis Mapetere - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(516,'monthly_invoice',153,'INV-2025-10-65',180.00,'USD','Monthly invoice - Bertha Majoni - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(517,'monthly_invoice',144,'INV-2025-10-66',160.00,'USD','Monthly invoice - Bertha Mwangu - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(518,'monthly_invoice',169,'INV-2025-10-67',160.00,'USD','Monthly invoice - Chantelle Gora - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(519,'monthly_invoice',143,'INV-2025-10-68',160.00,'USD','Monthly invoice - Christine Mutsikwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(520,'monthly_invoice',186,'INV-2025-10-69',160.00,'USD','Monthly invoice - Dion sengamai - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(521,'monthly_invoice',187,'INV-2025-10-70',160.00,'USD','Monthly invoice - Emma Yoradin - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(522,'monthly_invoice',173,'INV-2025-10-71',160.00,'USD','Monthly invoice - Fadzai Mhizha - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(523,'monthly_invoice',184,'INV-2025-10-115',160.00,'USD','Monthly invoice - Farai Muzembe - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(524,'monthly_invoice',142,'INV-2025-10-72',160.00,'USD','Monthly invoice - Fay Mubaiwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(525,'monthly_invoice',181,'INV-2025-10-73',160.00,'USD','Monthly invoice - Grace Vutika - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(526,'monthly_invoice',180,'INV-2025-10-74',160.00,'USD','Monthly invoice - Gracious - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(527,'monthly_invoice',160,'INV-2025-10-75',160.00,'USD','Monthly invoice - Kimbely Bones - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(528,'monthly_invoice',150,'INV-2025-10-76',180.00,'USD','Monthly invoice - Kimberly Mutowembwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(529,'monthly_invoice',149,'INV-2025-10-77',160.00,'USD','Monthly invoice - Kimberly Nkomo - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(530,'monthly_invoice',135,'INV-2025-10-78',180.00,'USD','Monthly invoice - Kudzai Matare - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(531,'monthly_invoice',189,'INV-2025-10-79',220.00,'USD','Monthly invoice - Kudzai Pemhiwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(532,'monthly_invoice',174,'INV-2025-10-80',120.00,'USD','Monthly invoice - Kuziwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:38',NULL,'posted'),(533,'monthly_invoice',138,'INV-2025-10-81',180.00,'USD','Monthly invoice - Lillian Chatikobo - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(534,'monthly_invoice',154,'INV-2025-10-82',170.00,'USD','Monthly invoice - Lorraine Mlambo - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(535,'monthly_invoice',145,'INV-2025-10-83',180.00,'USD','Monthly invoice - Merrylin Makunzva - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(536,'monthly_invoice',175,'INV-2025-10-84',160.00,'USD','Monthly invoice - Mitchel Chikosha - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(537,'monthly_invoice',167,'INV-2025-10-85',160.00,'USD','Monthly invoice - Munashe - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(538,'monthly_invoice',161,'INV-2025-10-86',180.00,'USD','Monthly invoice - Natasha Chinho - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(539,'monthly_invoice',159,'INV-2025-10-87',150.00,'USD','Monthly invoice - Nyashadzashe Chinorwiwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(540,'monthly_invoice',179,'INV-2025-10-88',160.00,'USD','Monthly invoice - Paidamoyo Munyimi - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(541,'monthly_invoice',183,'INV-2025-10-89',190.00,'USD','Monthly invoice - Pelagia Gomakalila - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(542,'monthly_invoice',165,'INV-2025-10-90',190.00,'USD','Monthly invoice - Precious Dziva - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(543,'monthly_invoice',157,'INV-2025-10-91',160.00,'USD','Monthly invoice - Precious Mashava - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(544,'monthly_invoice',182,'INV-2025-10-92',180.00,'USD','Monthly invoice - Rachel Madembe - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(545,'monthly_invoice',188,'INV-2025-10-93',160.00,'USD','Monthly invoice - Ropafadzo Masara - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(546,'monthly_invoice',156,'INV-2025-10-94',150.00,'USD','Monthly invoice - Rumbidzai Manyaora - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(547,'monthly_invoice',171,'INV-2025-10-95',180.00,'USD','Monthly invoice - Ruvimbo Singe - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(548,'monthly_invoice',147,'INV-2025-10-96',170.00,'USD','Monthly invoice - Salina Saidi - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(549,'monthly_invoice',168,'INV-2025-10-97',190.00,'USD','Monthly invoice - Sandra Chirinda - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(550,'monthly_invoice',170,'INV-2025-10-98',160.00,'USD','Monthly invoice - Shalom Gora - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(551,'monthly_invoice',136,'INV-2025-10-99',180.00,'USD','Monthly invoice - Shantel Mashe - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(552,'monthly_invoice',146,'INV-2025-10-100',180.00,'USD','Monthly invoice - Shantell Mawarira - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(553,'monthly_invoice',139,'INV-2025-10-101',180.00,'USD','Monthly invoice - Sharon Matanha - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(554,'monthly_invoice',162,'INV-2025-10-102',160.00,'USD','Monthly invoice - Tadiwa - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(555,'monthly_invoice',163,'INV-2025-10-103',180.00,'USD','Monthly invoice - Tadiwa Mhloro - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(556,'monthly_invoice',134,'INV-2025-10-104',190.00,'USD','Monthly invoice - Takudzwa Makunde - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(557,'monthly_invoice',158,'INV-2025-10-105',160.00,'USD','Monthly invoice - Tanaka Chikonyera - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(558,'monthly_invoice',141,'INV-2025-10-106',160.00,'USD','Monthly invoice - Tatenda Kamatando - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(559,'monthly_invoice',152,'INV-2025-10-107',180.00,'USD','Monthly invoice - Tawana Kuwana - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(560,'monthly_invoice',172,'INV-2025-10-108',160.00,'USD','Monthly invoice - Thelma Nzvimari - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(561,'monthly_invoice',148,'INV-2025-10-109',170.00,'USD','Monthly invoice - Tinotenda Bwangangwanyo - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(562,'monthly_invoice',185,'INV-2025-10-110',160.00,'USD','Monthly invoice - Tinotenda Chidavaenzi - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(563,'monthly_invoice',155,'INV-2025-10-111',170.00,'USD','Monthly invoice - Tinotenda Magiga - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(564,'monthly_invoice',132,'INV-2025-10-112',180.00,'USD','Monthly invoice - Trypheane Chinembiri - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(565,'monthly_invoice',177,'INV-2025-10-113',160.00,'USD','Monthly invoice - Vannessa Magorimbo - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(566,'monthly_invoice',176,'INV-2025-10-114',160.00,'USD','Monthly invoice - Vimbai - 2025-10','2025-09-30 22:00:00',10,6,'2025-11-13 11:12:39',NULL,'posted'),(567,'admin_fee',NULL,'ADMIN-1763032445792-nycr987h6',20.00,'USD','Admin fee for student enrollment - 193','2025-09-30 22:00:00',10,1,'2025-11-13 11:14:05',NULL,'posted'),(568,'initial_invoice',193,'INV-1763032445819-4i421fdwg',180.00,'USD','Initial invoice - Student','2025-09-30 22:00:00',10,1,'2025-11-13 11:14:05',NULL,'posted'),(569,'admin_fee',NULL,'ADMIN-1763032911482-jp83ks6zb',20.00,'USD','Admin fee for student enrollment - 194','2025-09-30 22:00:00',10,1,'2025-11-13 11:21:51',NULL,'posted'),(570,'initial_invoice',194,'INV-1763032911507-ou1cq0h0m',180.00,'USD','Initial invoice - Student','2025-09-30 22:00:00',10,1,'2025-11-13 11:21:51',NULL,'posted'),(571,'branch_payment',NULL,'BP-74',180.00,NULL,'Branch Payment - Student 194','2025-10-02 22:00:00',10,6,'2025-11-13 11:22:24',NULL,'posted'),(572,'branch_payment',NULL,'BP-75',220.00,NULL,'Branch Payment - Student 193','2025-10-01 22:00:00',10,6,'2025-11-13 11:22:43',NULL,'posted'),(573,'petty_cash_addition',NULL,'PCA-1763460332323',522.00,'USD','Petty Cash Addition: Replenish to pettycash','2025-09-30 22:00:00',10,6,'2025-11-18 10:05:32',NULL,'posted'),(574,'expense',NULL,'EXP-REQ-13',250.00,NULL,'Expenditure Request: Water','2025-09-30 22:00:00',10,6,'2025-11-18 10:06:48',NULL,'posted'),(575,'expense',NULL,'EXP-REQ-14',192.00,NULL,'Expenditure Request: Gas','2025-09-30 22:00:00',10,6,'2025-11-18 10:08:57',NULL,'posted'),(576,'expense',NULL,'EXP-REQ-15',40.00,NULL,'Expenditure Request: Solar service','2025-09-30 22:00:00',10,6,'2025-11-18 10:11:44',NULL,'posted'),(577,'expense',NULL,'EXP-REQ-16',40.00,NULL,'Expenditure Request: firewood','2025-09-30 22:00:00',10,6,'2025-11-18 10:14:44',NULL,'posted'),(578,'petty_cash_withdrawal',NULL,'PCW-1763460939613',1280.00,'USD','Petty Cash Withdrawal: Rent collected','2025-09-30 22:00:00',10,6,'2025-11-18 10:15:39',NULL,'posted'),(579,'petty_cash_withdrawal',NULL,'PCW-1763461064666',1912.00,'USD','Petty Cash Withdrawal: Rent collected ','2025-09-30 22:00:00',10,6,'2025-11-18 10:17:44',NULL,'posted'),(580,'petty_cash_withdrawal',NULL,'PCW-1763461127389',1040.00,'USD','Petty Cash Withdrawal: rental collected','2025-09-30 22:00:00',10,6,'2025-11-18 10:18:47',NULL,'posted'),(581,'petty_cash_addition',NULL,'PCA-1763461194000',700.00,'USD','Petty Cash Addition: replenish pettycash','2025-10-09 22:00:00',10,6,'2025-11-18 10:19:54',NULL,'posted'),(582,'expense',NULL,'EXP-REQ-17',400.00,NULL,'Expenditure Request: Security','2025-10-09 22:00:00',10,6,'2025-11-18 10:24:20',NULL,'posted'),(583,'expense',NULL,'EXP-REQ-18',250.00,NULL,'Expenditure Request: Water','2025-10-10 22:00:00',10,6,'2025-11-18 12:13:11',NULL,'posted'),(584,'petty_cash_withdrawal',NULL,'PCW-1763468043416',305.00,'USD','Petty Cash Withdrawal: Rental collection','2025-10-10 22:00:00',10,6,'2025-11-18 12:14:03',NULL,'posted'),(585,'petty_cash_addition',NULL,'PCA-1763468092323',90.00,'USD','Petty Cash Addition: replenish pettycash','2025-10-09 22:00:00',10,6,'2025-11-18 12:14:52',NULL,'posted'),(586,'expense',NULL,'EXP-REQ-19',90.00,NULL,'Expenditure Request: Sanitary','2025-10-09 22:00:00',10,6,'2025-11-18 12:16:36',NULL,'posted'),(587,'petty_cash_withdrawal',NULL,'PCW-1763468243239',870.00,'USD','Petty Cash Withdrawal: Rentals surrendered','2025-11-12 22:00:00',10,6,'2025-11-18 12:17:23',NULL,'posted'),(588,'petty_cash_addition',NULL,'PCA-1763468286094',260.00,'USD','Petty Cash Addition: replenish pettycash','2025-10-15 22:00:00',10,6,'2025-11-18 12:18:06',NULL,'posted'),(589,'expense',NULL,'EXP-REQ-20',150.00,NULL,'Expenditure Request: water','2025-10-15 22:00:00',10,6,'2025-11-18 12:19:25',NULL,'posted'),(590,'expense',NULL,'EXP-REQ-21',40.00,NULL,'Expenditure Request: firewood','2025-10-15 22:00:00',10,6,'2025-11-18 12:20:59',NULL,'posted'),(591,'expense',NULL,'EXP-REQ-22',30.00,NULL,'Expenditure Request: Wifi fixing misc','2025-10-15 22:00:00',10,6,'2025-11-18 12:22:22',NULL,'posted'),(592,'expense',NULL,'EXP-REQ-23',10.00,NULL,'Expenditure Request: Cleaning supplies','2025-10-17 22:00:00',10,6,'2025-11-18 12:23:44',NULL,'posted'),(593,'expense',NULL,'EXP-REQ-24',30.00,NULL,'Expenditure Request: Garbage collection','2025-10-15 22:00:00',10,6,'2025-11-18 12:25:19',NULL,'posted'),(594,'petty_cash_withdrawal',NULL,'PCW-1763468820554',165.00,'USD','Petty Cash Withdrawal: rentals collected','2025-10-15 22:00:00',10,6,'2025-11-18 12:27:00',NULL,'posted'),(595,'petty_cash_withdrawal',NULL,'PCW-1763468849382',260.00,'USD','Petty Cash Withdrawal: rentals collected','2025-10-19 22:00:00',10,6,'2025-11-18 12:27:29',NULL,'posted'),(596,'petty_cash_addition',NULL,'PCA-1763468895052',100.00,'USD','Petty Cash Addition: replenish pettycash','2025-10-22 22:00:00',10,6,'2025-11-18 12:28:15',NULL,'posted'),(597,'expense',NULL,'EXP-REQ-25',100.00,NULL,'Expenditure Request: water','2025-10-22 22:00:00',10,6,'2025-11-18 12:29:05',NULL,'posted'),(598,'petty_cash_withdrawal',NULL,'PCW-1763469072458',1810.00,'USD','Petty Cash Withdrawal: rentalsa recevied','2025-10-02 22:00:00',10,6,'2025-11-18 12:31:12',NULL,'posted'),(599,'petty_cash_withdrawal',NULL,'PCW-1763469140609',100.00,'USD','Petty Cash Withdrawal: rentals','2025-10-26 22:00:00',10,6,'2025-11-18 12:32:20',NULL,'posted'),(600,'petty_cash_withdrawal',NULL,'PCW-1763469229157',200.00,'USD','Petty Cash Withdrawal: rentals via bank','2025-10-02 22:00:00',10,6,'2025-11-18 12:33:49',NULL,'posted'),(601,'petty_cash_withdrawal',NULL,'PCW-1763469270287',180.00,'USD','Petty Cash Withdrawal: rentals via bank','2025-10-16 22:00:00',10,6,'2025-11-18 12:34:30',NULL,'posted'),(602,'expense',NULL,'EXP-20251118-143557',200.00,'USD','water expenses','2025-09-30 22:00:00',10,1,'2025-11-18 12:36:41',NULL,'posted'),(603,'expense',NULL,'EXP-20251118-143704',100.00,'USD','city council rates','2025-09-30 22:00:00',10,1,'2025-11-18 12:37:31',NULL,'posted'),(604,'expense',NULL,'EXP-20251118-143752',100.00,'USD','wifi','2025-09-30 22:00:00',10,1,'2025-11-18 12:38:20',NULL,'posted'),(605,'expense',NULL,'EXP-20251118-144353',1300.00,'USD','ALAMAIT MANAGEMENT FEE','2025-10-28 22:00:00',10,1,'2025-11-18 12:45:06',NULL,'posted'),(606,'expense',NULL,'EXP-20251118-144722',2000.00,'USD','payment rental meadow and willow','2025-10-29 22:00:00',10,1,'2025-11-18 12:48:41',NULL,'posted'),(607,'expense',NULL,'EXP-20251118-145849',1115.00,'USD','alamait management fee','2025-10-29 22:00:00',10,1,'2025-11-18 12:59:19',NULL,'posted'),(608,'expense',NULL,'EXP-20251118-150536',185.00,'USD','rapid response','2025-10-13 22:00:00',10,1,'2025-11-18 13:05:55',NULL,'posted'),(609,'expense',NULL,'EXP-20251118-150716',5.60,'USD','Bank charges','2025-10-13 22:00:00',10,1,'2025-11-18 13:07:40',NULL,'posted'),(610,'banking_transfer',NULL,'BT-1763471403808',500.00,'USD','Transfer: tranfer to cbz vault','2025-10-29 22:00:00',10,6,'2025-11-18 13:10:03',NULL,'posted');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `national_id` varchar(100) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `address` text,
  `phone_number` varchar(50) DEFAULT NULL,
  `boarding_house_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'sysadmin','super_admin','tatendamuzenda740@gmail.com','$2b$10$cdVMaq3LdspJV1imYsqJDe2DONXC.89wCgent8Mnq35NgWFcGUjkG','29-2098334N83','male','6334 southview','0771472707',NULL,'2025-06-19 14:40:29','2025-11-10 19:22:32'),(2,'tatenda','operations_officer','tatenda@example.com','$2b$10$Gi4zjjOfe32iiRVwXIuAWefb6gR96Gi0NoXICOc6DhC7sECt590Te','23-2098334N83','Male','22sw','0771472707',1,'2025-06-19 15:15:04','2025-11-10 19:06:02'),(3,'phoebe','operations_officer','tatendamuzenda740@gmail.com','$2b$10$yRWV4SrFLTfNjhf0s9P60uiPSUWyCx3YbJVgQjRAu5/pVVw9bukim','29-2098334N83','female','6334 southview','0771472707',2,'2025-07-07 21:31:34','2025-11-10 19:06:10'),(4,'admin','admin','admin@example.com','$2b$10$puzPfk.fSEKKODq.7AI6beelsSd28f3xOPOrBD2ikAysYwFzSz/aK','12345678890','male','Capesso Eastlea','1234567890',NULL,'2025-08-08 09:26:43','2025-11-10 19:06:15'),(5,'marko','operations_officer','tatendamuzenda740@gmail.com','$2b$10$gnC4WPzBKbsubjQqY/9mruLU1eSvl7kcV91nDm9V98v.iK6FWfyX2','29-2098334N834','male','6334 southview','0771472707',NULL,'2025-10-22 08:11:23','2025-11-10 19:06:13'),(6,'sysadmin','admin','tatendamuzenda740@gmail.com','$2b$10$SVQzcgJbGHaa.594pXBmoelqvFcRpBdVkapvXIw0uPktSfvgGIegW','29-2098334N83','male','6334 southview','0771472707',NULL,'2025-11-10 19:22:48',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `account_ledger_with_bd_cd`
--

/*!50001 DROP VIEW IF EXISTS `account_ledger_with_bd_cd`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `account_ledger_with_bd_cd` AS select `coa`.`id` AS `account_id`,`coa`.`code` AS `account_code`,`coa`.`name` AS `account_name`,`coa`.`type` AS `account_type`,`bp`.`period_name` AS `period_name`,`bp`.`period_start_date` AS `period_start_date`,`bp`.`period_end_date` AS `period_end_date`,(case when (row_number() OVER (PARTITION BY `coa`.`id`,`bp`.`id` ORDER BY `t`.`transaction_date`,`t`.`id` )  = 1) then `apb`.`balance_brought_down` else 0 end) AS `balance_brought_down`,`t`.`transaction_date` AS `transaction_date`,`t`.`reference` AS `reference`,`t`.`description` AS `description`,`je`.`entry_type` AS `entry_type`,`je`.`amount` AS `amount`,(case when (`je`.`entry_type` = 'debit') then `je`.`amount` else 0 end) AS `debit_amount`,(case when (`je`.`entry_type` = 'credit') then `je`.`amount` else 0 end) AS `credit_amount`,(case when (`coa`.`type` in ('Asset','Expense')) then ((`apb`.`balance_brought_down` + sum((case when (`je2`.`entry_type` = 'debit') then `je2`.`amount` else 0 end)) OVER (PARTITION BY `coa`.`id`,`bp`.`id` ORDER BY `t2`.`transaction_date`,`t2`.`id`,`je2`.`id` ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) ) - sum((case when (`je2`.`entry_type` = 'credit') then `je2`.`amount` else 0 end)) OVER (PARTITION BY `coa`.`id`,`bp`.`id` ORDER BY `t2`.`transaction_date`,`t2`.`id`,`je2`.`id` ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) ) when (`coa`.`type` in ('Liability','Equity','Revenue')) then ((`apb`.`balance_brought_down` + sum((case when (`je2`.`entry_type` = 'credit') then `je2`.`amount` else 0 end)) OVER (PARTITION BY `coa`.`id`,`bp`.`id` ORDER BY `t2`.`transaction_date`,`t2`.`id`,`je2`.`id` ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) ) - sum((case when (`je2`.`entry_type` = 'debit') then `je2`.`amount` else 0 end)) OVER (PARTITION BY `coa`.`id`,`bp`.`id` ORDER BY `t2`.`transaction_date`,`t2`.`id`,`je2`.`id` ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) ) else 0 end) AS `running_balance`,(case when (row_number() OVER (PARTITION BY `coa`.`id`,`bp`.`id` ORDER BY `t`.`transaction_date` desc,`t`.`id` desc )  = 1) then `apb`.`balance_carried_down` else 0 end) AS `balance_carried_down`,`t`.`id` AS `transaction_id`,`je`.`id` AS `journal_entry_id`,`bp`.`id` AS `period_id` from ((((((`chart_of_accounts` `coa` join `balance_periods` `bp`) left join `account_period_balances` `apb` on(((`coa`.`id` = `apb`.`account_id`) and (`bp`.`id` = `apb`.`period_id`)))) left join `journal_entries` `je` on(((`coa`.`id` = `je`.`account_id`) and (`je`.`deleted_at` is null)))) left join `transactions` `t` on(((`je`.`transaction_id` = `t`.`id`) and (`t`.`deleted_at` is null) and (`t`.`status` = 'posted')))) left join `journal_entries` `je2` on(((`coa`.`id` = `je2`.`account_id`) and (`je2`.`deleted_at` is null)))) left join `transactions` `t2` on(((`je2`.`transaction_id` = `t2`.`id`) and (`t2`.`deleted_at` is null) and (`t2`.`status` = 'posted')))) where ((`coa`.`deleted_at` is null) and (`t`.`transaction_date` between `bp`.`period_start_date` and `bp`.`period_end_date`)) order by `coa`.`code`,`bp`.`period_start_date`,`t`.`transaction_date`,`t`.`id`,`je`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_period_balances`
--

/*!50001 DROP VIEW IF EXISTS `current_period_balances`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `current_period_balances` AS select `coa`.`id` AS `account_id`,`coa`.`code` AS `account_code`,`coa`.`name` AS `account_name`,`coa`.`type` AS `account_type`,`bp`.`id` AS `period_id`,`bp`.`period_name` AS `period_name`,`bp`.`period_start_date` AS `period_start_date`,`bp`.`period_end_date` AS `period_end_date`,`apb`.`balance_brought_down` AS `balance_brought_down`,`apb`.`balance_carried_down` AS `balance_carried_down`,`apb`.`total_debits` AS `total_debits`,`apb`.`total_credits` AS `total_credits`,`apb`.`transaction_count` AS `transaction_count`,`apb`.`is_verified` AS `is_verified`,(case when (`coa`.`type` in ('Asset','Expense')) then ((`apb`.`balance_brought_down` + `apb`.`total_debits`) - `apb`.`total_credits`) when (`coa`.`type` in ('Liability','Equity','Revenue')) then ((`apb`.`balance_brought_down` + `apb`.`total_credits`) - `apb`.`total_debits`) else 0 end) AS `calculated_balance`,`apb`.`balance_carried_down` AS `current_balance` from ((`chart_of_accounts` `coa` join `balance_periods` `bp`) left join `account_period_balances` `apb` on(((`coa`.`id` = `apb`.`account_id`) and (`bp`.`id` = `apb`.`period_id`)))) where ((`coa`.`deleted_at` is null) and (`bp`.`is_closed` = false)) order by `coa`.`code`,`bp`.`period_start_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-18 19:54:09
