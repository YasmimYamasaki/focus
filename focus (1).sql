-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 16/04/2026 às 02:48
-- Versão do servidor: 9.1.0
-- Versão do PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `focus`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_admins`
--

DROP TABLE IF EXISTS `tb_admins`;
CREATE TABLE IF NOT EXISTS `tb_admins` (
  `adm_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `adm_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adm_photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adm_status` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`adm_id`),
  UNIQUE KEY `admname` (`adm_name`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_calls`
--

DROP TABLE IF EXISTS `tb_calls`;
CREATE TABLE IF NOT EXISTS `tb_calls` (
  `call_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `call_code` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` bigint UNSIGNED DEFAULT NULL,
  `adm_id` bigint UNSIGNED DEFAULT NULL,
  `call_subject` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `call_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `call_reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `call_priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `call_status` enum('pending','replied','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`call_id`),
  UNIQUE KEY `code` (`call_code`),
  KEY `profile_id` (`profile_id`),
  KEY `adm_id` (`adm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tb_calls`
--

INSERT INTO `tb_calls` (`call_id`, `call_code`, `profile_id`, `adm_id`, `call_subject`, `call_message`, `call_reply`, `call_priority`, `call_status`, `replied_at`, `created_at`, `updated_at`) VALUES
(1, 'CALL-740CD3', NULL, NULL, 'Cancelaram meu acesso', 'Revogaram meu acesso geral', NULL, '', 'pending', NULL, '2026-04-16 02:21:39', '2026-04-16 02:21:39');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_profiles`
--

DROP TABLE IF EXISTS `tb_profiles`;
CREATE TABLE IF NOT EXISTS `tb_profiles` (
  `profile_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `profile_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_streak` int NOT NULL DEFAULT '0',
  `profile_xp` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `profiles_username_unique` (`profile_name`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `profiles_user_id_foreign` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tb_profiles`
--

INSERT INTO `tb_profiles` (`profile_id`, `user_id`, `profile_name`, `profile_photo`, `profile_streak`, `profile_xp`, `created_at`, `updated_at`) VALUES
(1, 1, 'Davidson Ribeiro', 'user_69e047f409c01.jfif', 0, 0, '2026-04-16 02:22:44', '2026-04-16 02:22:44');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_schedules`
--

DROP TABLE IF EXISTS `tb_schedules`;
CREATE TABLE IF NOT EXISTS `tb_schedules` (
  `schedule_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `profile_id` bigint UNSIGNED NOT NULL,
  `schedule_time` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  KEY `schedules_profile_id_foreign` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_schedulings`
--

DROP TABLE IF EXISTS `tb_schedulings`;
CREATE TABLE IF NOT EXISTS `tb_schedulings` (
  `scheduling_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `schedule_id` bigint UNSIGNED NOT NULL,
  `task_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`scheduling_id`),
  KEY `scheduling_schedule_id_foreign` (`schedule_id`),
  KEY `scheduling_task_id_foreign` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_tasks`
--

DROP TABLE IF EXISTS `tb_tasks`;
CREATE TABLE IF NOT EXISTS `tb_tasks` (
  `task_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `profile_id` bigint UNSIGNED NOT NULL,
  `task_title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_priority` enum('high','medium','low') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `task_done` tinyint(1) NOT NULL DEFAULT '0',
  `task_tag` char(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  KEY `tasks_ibfk_1` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_tokens`
--

DROP TABLE IF EXISTS `tb_tokens`;
CREATE TABLE IF NOT EXISTS `tb_tokens` (
  `token_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `token_content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_users`
--

DROP TABLE IF EXISTS `tb_users`;
CREATE TABLE IF NOT EXISTS `tb_users` (
  `user_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `user_password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `users_email_unique` (`user_email`),
  UNIQUE KEY `email` (`user_email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tb_users`
--

INSERT INTO `tb_users` (`user_id`, `user_name`, `user_email`, `email_verified_at`, `user_password`, `created_at`, `updated_at`) VALUES
(1, 'Davidson', 'deoliveiramoreiramatheus67@gmail.com', NULL, '$2y$10$EGqoaym321eyLkkHiYsMa.THbPPx5hhFBdxrG34atMkTjbhVpA2G2', '2026-04-16 02:22:44', '2026-04-16 02:22:44');

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `tb_admins`
--
ALTER TABLE `tb_admins`
  ADD CONSTRAINT `tb_admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tb_users` (`user_id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tb_calls`
--
ALTER TABLE `tb_calls`
  ADD CONSTRAINT `tb_calls_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `tb_profiles` (`profile_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tb_calls_ibfk_2` FOREIGN KEY (`adm_id`) REFERENCES `tb_admins` (`adm_id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `tb_profiles`
--
ALTER TABLE `tb_profiles`
  ADD CONSTRAINT `profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `tb_users` (`user_id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tb_schedules`
--
ALTER TABLE `tb_schedules`
  ADD CONSTRAINT `schedules_profile_id_foreign` FOREIGN KEY (`profile_id`) REFERENCES `tb_profiles` (`profile_id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tb_schedulings`
--
ALTER TABLE `tb_schedulings`
  ADD CONSTRAINT `scheduling_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `tb_schedules` (`schedule_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scheduling_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tb_tasks` (`task_id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tb_tasks`
--
ALTER TABLE `tb_tasks`
  ADD CONSTRAINT `tb_tasks_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `tb_profiles` (`profile_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
