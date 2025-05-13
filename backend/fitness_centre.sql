/*
 Navicat Premium Dump SQL

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80029 (8.0.29)
 Source Host           : localhost:3306
 Source Schema         : fitness_centre

 Target Server Type    : MySQL
 Target Server Version : 80029 (8.0.29)
 File Encoding         : 65001

 Date: 13/05/2025 23:14:02
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for coach_availability
-- ----------------------------
DROP TABLE IF EXISTS `coach_availability`;
CREATE TABLE `coach_availability` (
  `id` bigint NOT NULL,
  `coach_id` bigint NOT NULL,
  `day_of_week` tinyint DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`,`coach_id`) USING BTREE,
  KEY `connect_coach` (`coach_id`),
  CONSTRAINT `connect_coach` FOREIGN KEY (`coach_id`) REFERENCES `coach_info` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of coach_availability
-- ----------------------------
BEGIN;
INSERT INTO `coach_availability` (`id`, `coach_id`, `day_of_week`, `start_time`, `end_time`) VALUES (1922261295433732098, 1922255875071758337, 3, '08:30:00', '10:30:00');
INSERT INTO `coach_availability` (`id`, `coach_id`, `day_of_week`, `start_time`, `end_time`) VALUES (1922379599976464386, 1922292447842357249, 5, '13:00:00', '15:00:00');
INSERT INTO `coach_availability` (`id`, `coach_id`, `day_of_week`, `start_time`, `end_time`) VALUES (1922404164349960193, 1922255875071758337, 1, '19:30:00', '21:45:00');
COMMIT;

-- ----------------------------
-- Table structure for coach_info
-- ----------------------------
DROP TABLE IF EXISTS `coach_info`;
CREATE TABLE `coach_info` (
  `id` bigint NOT NULL,
  `intro` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `rating` double DEFAULT '0',
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  CONSTRAINT `user_id关联` FOREIGN KEY (`id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of coach_info
-- ----------------------------
BEGIN;
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922255875071758337, 'With a strong passion for health, fitness, and personal transformation, I’ve spent the past 1 years helping people become the strongest, healthiest, and most confident versions of themselves. Whether you\'re just starting out or looking to take your training to the next level, I’m here to guide you every step of the way.\n\nI specialize in [e.g., strength training, weight loss, HIIT, functional fitness, etc.], and I tailor every program to fit each client’s goals, lifestyle, and fitness level. My philosophy is simple: consistency, proper technique, and a positive mindset lead to real and lasting results.\n\nLet’s work together to build not just a better body, but a stronger you—inside and out.\n\nLet’s get moving!', 0, '/temp/1922255875071758337.png');
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922292447842357249, 'With a strong passion for health, fitness, and personal transformation, I’ve spent the past 5 years helping people become the strongest, healthiest, and most confident versions of themselves. Whether you\'re just starting out or looking to take your training to the next level, I’m here to guide you every step of the way.\n\nI specialize in [e.g., strength training, weight loss, HIIT, functional fitness, etc.], and I tailor every program to fit each client’s goals, lifestyle, and fitness level. My philosophy is simple: consistency, proper technique, and a positive mindset lead to real and lasting results.\n\nLet’s work together to build not just a better body, but a stronger you—inside and out.\n\nLet’s get moving!', 0, '/temp/1922292447842357249.png');
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922293720092200961, 'With a strong passion for health, fitness, and personal transformation, I’ve spent the past 5 years helping people become the strongest, healthiest, and most confident versions of themselves. Whether you\'re just starting out or looking to take your training to the next level, I’m here to guide you every step of the way.\n\nI specialize in [e.g., strength training, weight loss, HIIT, functional fitness, etc.], and I tailor every program to fit each client’s goals, lifestyle, and fitness level. My philosophy is simple: consistency, proper technique, and a positive mindset lead to real and lasting results.\n\nLet’s work together to build not just a better body, but a stronger you—inside and out.\n\nLet’s get moving!', 0, '/temp/1922293720092200961.png');
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922295190594211841, '', 0, '/temp/1922295190594211841.png');
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922297601954107393, '', 0, '/temp/1922297601954107393.png');
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922300445130182658, 'I ready to help you improve you ability.', 0, '/temp/1922300445130182658.png');
INSERT INTO `coach_info` (`id`, `intro`, `rating`, `photo`) VALUES (1922302887360155649, 'I ready to help you.', 0, '/temp/1922302887360155649.png');
COMMIT;

-- ----------------------------
-- Table structure for coach_location
-- ----------------------------
DROP TABLE IF EXISTS `coach_location`;
CREATE TABLE `coach_location` (
  `coach_id` bigint NOT NULL,
  `location_id` bigint NOT NULL,
  PRIMARY KEY (`coach_id`,`location_id`),
  KEY `link location` (`location_id`),
  CONSTRAINT `link coach` FOREIGN KEY (`coach_id`) REFERENCES `coach_info` (`id`) ON DELETE CASCADE,
  CONSTRAINT `link location` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of coach_location
-- ----------------------------
BEGIN;
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922295190594211841, 1);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922293720092200961, 2);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922300445130182658, 2);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922255875071758337, 5);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922302887360155649, 5);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922293720092200961, 6);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922295190594211841, 6);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922297601954107393, 7);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922302887360155649, 7);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922293720092200961, 8);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922297601954107393, 8);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922293720092200961, 9);
INSERT INTO `coach_location` (`coach_id`, `location_id`) VALUES (1922295190594211841, 10);
COMMIT;

-- ----------------------------
-- Table structure for coach_tag
-- ----------------------------
DROP TABLE IF EXISTS `coach_tag`;
CREATE TABLE `coach_tag` (
  `tag_id` bigint NOT NULL,
  `coach_id` bigint NOT NULL,
  PRIMARY KEY (`tag_id`,`coach_id`),
  KEY `coach关联` (`coach_id`),
  CONSTRAINT `coach关联` FOREIGN KEY (`coach_id`) REFERENCES `coach_info` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tag关联` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of coach_tag
-- ----------------------------
BEGIN;
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (3, 1922255875071758337);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (5, 1922255875071758337);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (8, 1922255875071758337);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (9, 1922292447842357249);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (13, 1922292447842357249);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (15, 1922292447842357249);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (13, 1922293720092200961);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (14, 1922293720092200961);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (15, 1922293720092200961);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (16, 1922293720092200961);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (3, 1922295190594211841);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (5, 1922295190594211841);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (7, 1922295190594211841);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (9, 1922295190594211841);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (12, 1922297601954107393);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (13, 1922297601954107393);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (4, 1922300445130182658);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (6, 1922300445130182658);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (8, 1922302887360155649);
INSERT INTO `coach_tag` (`tag_id`, `coach_id`) VALUES (10, 1922302887360155649);
COMMIT;

-- ----------------------------
-- Table structure for history_tag
-- ----------------------------
DROP TABLE IF EXISTS `history_tag`;
CREATE TABLE `history_tag` (
  `history_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`history_id`,`tag_id`),
  KEY `connect_tag` (`tag_id`),
  CONSTRAINT `connect_history` FOREIGN KEY (`history_id`) REFERENCES `training_history` (`id`) ON DELETE CASCADE,
  CONSTRAINT `connect_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of history_tag
-- ----------------------------
BEGIN;
INSERT INTO `history_tag` (`history_id`, `tag_id`) VALUES (1922261949350891522, 4);
INSERT INTO `history_tag` (`history_id`, `tag_id`) VALUES (1922261949350891522, 5);
INSERT INTO `history_tag` (`history_id`, `tag_id`) VALUES (1922261949350891522, 9);
INSERT INTO `history_tag` (`history_id`, `tag_id`) VALUES (1922261949350891522, 13);
COMMIT;

-- ----------------------------
-- Table structure for location
-- ----------------------------
DROP TABLE IF EXISTS `location`;
CREATE TABLE `location` (
  `id` bigint NOT NULL,
  `location_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `postcode` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of location
-- ----------------------------
BEGIN;
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (1, 'NovaPulse - Southampton City Centre', -1.4043, 50.9039, 'SO14 0AB');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (2, 'NovaPulse - Portswood', -1.3893, 50.9289, 'SO17 2LB');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (3, 'NovaPulse - Shirley', -1.4264, 50.9191, 'SO15 3EY');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (5, 'NovaPulse - Eastleigh', -1.362, 50.9696, 'SO50 5PP');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (6, 'NovaPulse - Winchester', -1.308, 51.0632, 'SO23 8UJ');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (7, 'NovaPulse - Fareham', -1.1777, 50.853, 'PO16 0EN');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (8, 'NovaPulse - Portsmouth', -1.0912, 50.7989, 'PO1 3PX');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (9, 'NovaPulse - Romsey', -1.4999, 50.9885, 'SO51 8DP');
INSERT INTO `location` (`id`, `location_name`, `longitude`, `latitude`, `postcode`) VALUES (10, 'NovaPulse - Waterlooville', -1.0246, 50.8811, 'PO7 7GP');
COMMIT;

-- ----------------------------
-- Table structure for session_booking
-- ----------------------------
DROP TABLE IF EXISTS `session_booking`;
CREATE TABLE `session_booking` (
  `id` bigint NOT NULL,
  `coach_id` bigint DEFAULT NULL,
  `member_id` bigint DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `reply` varchar(255) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `request_time` datetime DEFAULT NULL,
  `response_time` datetime DEFAULT NULL,
  `coach_is_read` tinyint DEFAULT NULL,
  `member_is_read` tinyint DEFAULT NULL,
  `cancel_time` datetime DEFAULT NULL,
  `is_record` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `connect_member` (`member_id`),
  KEY `coach_connect` (`coach_id`),
  CONSTRAINT `coach_connect` FOREIGN KEY (`coach_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `connect_member` FOREIGN KEY (`member_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of session_booking
-- ----------------------------
BEGIN;
INSERT INTO `session_booking` (`id`, `coach_id`, `member_id`, `start_time`, `end_time`, `status`, `reply`, `message`, `request_time`, `response_time`, `coach_is_read`, `member_is_read`, `cancel_time`, `is_record`) VALUES (1922404753532231681, 1922255875071758337, 1922260669211561985, '2025-05-19 19:30:00', '2025-05-19 20:30:00', 'ACCEPT', 'hello', 'hello', '2025-05-13 22:33:04', '2025-05-13 22:33:13', 1, 0, NULL, 0);
COMMIT;

-- ----------------------------
-- Table structure for subscription
-- ----------------------------
DROP TABLE IF EXISTS `subscription`;
CREATE TABLE `subscription` (
  `id` bigint NOT NULL,
  `member_id` bigint NOT NULL,
  `coach_id` bigint NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `reply` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `request_time` datetime DEFAULT NULL,
  `response_time` datetime DEFAULT NULL,
  `cancel_time` datetime DEFAULT NULL,
  `coach_is_read` tinyint DEFAULT NULL,
  `member_is_read` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `connect_meber` (`member_id`),
  KEY `connect-coach` (`coach_id`),
  CONSTRAINT `connect-coach` FOREIGN KEY (`coach_id`) REFERENCES `coach_info` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `connect_meber` FOREIGN KEY (`member_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of subscription
-- ----------------------------
BEGIN;
INSERT INTO `subscription` (`id`, `member_id`, `coach_id`, `status`, `reply`, `message`, `request_time`, `response_time`, `cancel_time`, `coach_is_read`, `member_is_read`) VALUES (1922260931095515138, 1922260669211561985, 1922255875071758337, 'ACCEPT', 'hello', 'hello', '2025-05-13 13:01:35', '2025-05-13 13:02:05', NULL, 1, 1);
INSERT INTO `subscription` (`id`, `member_id`, `coach_id`, `status`, `reply`, `message`, `request_time`, `response_time`, `cancel_time`, `coach_is_read`, `member_is_read`) VALUES (1922378822360891393, 1922260669211561985, 1922292447842357249, 'ACCEPT', 'I glad to help you.', 'I want to learn from you.', '2025-05-13 20:50:02', '2025-05-13 20:50:25', NULL, 1, 1);
COMMIT;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `role` varchar(255) NOT NULL,
  `gender` tinyint NOT NULL,
  `birthday` date NOT NULL,
  `address` varchar(255) NOT NULL,
  `register_time` datetime NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `provider_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id` DESC),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1922302887360155650 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of sys_user
-- ----------------------------
BEGIN;
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922302887360155649, '5goslpae53@iwatermail.com', '$2a$10$tCICLqz7MXqfixlaEjGpwO3x4lu384../NHKc1WL1k8qR4t.0l/yi', 'coach', 0, '1997-05-09', '15 Orchid Crescent, Singapore 769123, Singapore', '2025-05-13 15:48:18', 0, 'William Chen', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922300445130182658, 'xliflpyfhm@iwatermail.com', '$2a$10$cqkQkcNBlGn7nsg5IkYEc.iuw1B47Ga7cRV8nTMceWwwUBrPP3z9y', 'coach', 1, '2001-05-01', '29 Hollypark Avenue, Dublin 6, D06 YN25, Ireland', '2025-05-13 15:38:35', 0, 'Sophia O’Connor', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922297601954107393, 'o0n6kc6a2m@iwatermail.com', '$2a$10$pZMS9CSDRZRkr6lOs8ThJ.2oKu0eYa8SN51wC9/DNMBXFm.1Gf4wK', 'coach', 0, '1998-05-06', '4024 Maple Street, Denver, CO 80205, USA', '2025-05-13 15:27:18', 0, 'Ethan Schmidt', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922295190594211841, '0gcolkey3l@iwatermail.com', '$2a$10$LPD4lylTuTYDg6jSTPMmEOIi/svFjkaw8t9yHWZqnFLvVxsdfW5Fi', 'coach', 0, '1996-05-09', '114 Cherry Blossom Road, Wellington 6011, New Zealand', '2025-05-13 15:17:43', 0, 'Mia Johnson', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922293720092200961, 'dlnep5eysm@iwatermail.com', '$2a$10$sCMociWdQKPefyXQki8LietYMq4rw01vgLEnWWnRh9/FM0Caivg/S', 'coach', 0, '2004-05-05', '8 Harbourview Terrace, Vancouver, BC V6K 1V1, Canada', '2025-05-13 15:11:52', 0, 'Noah Patel', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922292447842357249, 'sgo0ek6y3l@iwatermail.com', '$2a$10$ueSWOa0RF0B6IcfkihlclOJ4CFX0.84x6/5Mk1IEGynnnhNG44z9W', 'coach', 1, '1999-05-12', '240 Avenida del Sol, Apt 3B, San Antonio, TX 78205, USA', '2025-05-13 15:06:49', 0, 'Emma García', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922260669211561985, 'i6iuckys5p@iwatermail.com', '$2a$10$nRwPA.kpWa/lNgEIT05cRuKsdcaEAb.fOAYUmku9ARKcG8DDX6JE6', 'member', 0, '2006-05-01', '1289 Willowbrook Lane, Cambridge, MA 02138, USA', '2025-05-13 13:00:32', 0, 'Olivia Bennett', 'Local', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1922255875071758337, 'fzuhuyanjie@gmail.com', NULL, 'coach', 1, '2011-04-06', '57 Kingfisher Drive, Manchester M20 4RY, United Kingdom', '2025-05-13 12:41:29', 0, 'Lucas Robinson', 'Google', NULL);
INSERT INTO `sys_user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`, `provider`, `provider_id`) VALUES (1, '1946441559@qq.com', '$2a$10$eYmlFx/trkIe6HdxpjucQOAUn/hhLWG5O4.W33ptwhZeOMHPSm86u', 'admin', 1, '2025-03-06', 'd', '2025-03-08 20:24:09', 0, '1dada', NULL, 0);
COMMIT;

-- ----------------------------
-- Table structure for tag
-- ----------------------------
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of tag
-- ----------------------------
BEGIN;
INSERT INTO `tag` (`id`, `tag_name`) VALUES (3, 'StrengthTraining');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (4, 'WeightLoss');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (5, 'FunctionalTraining');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (6, 'Bodybuilding');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (7, 'SportsPerformance');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (8, 'HIIT');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (9, 'Rehabilitation');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (10, 'NutritionGuidance');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (11, 'Mobility');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (12, 'Endurance');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (13, 'PostnatalFitness');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (14, 'Pilates');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (15, 'Yoga');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (16, 'SeniorFitness');
INSERT INTO `tag` (`id`, `tag_name`) VALUES (17, 'CoreStability');
COMMIT;

-- ----------------------------
-- Table structure for training_history
-- ----------------------------
DROP TABLE IF EXISTS `training_history`;
CREATE TABLE `training_history` (
  `id` bigint NOT NULL,
  `member_id` bigint NOT NULL,
  `coach_id` bigint NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `member_is_read` tinyint DEFAULT NULL,
  `feedback` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of training_history
-- ----------------------------
BEGIN;
INSERT INTO `training_history` (`id`, `member_id`, `coach_id`, `start_time`, `end_time`, `message`, `member_is_read`, `feedback`) VALUES (1922261949350891522, 1922260669211561985, 1922255875071758337, '2025-05-12 08:30:00', '2025-05-12 09:30:00', 'hello', 1, 'good');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
