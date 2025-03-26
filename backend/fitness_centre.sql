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

 Date: 09/03/2025 00:12:33
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `gender` tinyint NOT NULL,
  `birthday` date NOT NULL,
  `address` varchar(255) NOT NULL,
  `register_time` datetime NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of user
-- ----------------------------
BEGIN;
INSERT INTO `user` (`id`, `email`, `password`, `role`, `gender`, `birthday`, `address`, `register_time`, `status`, `user_name`) VALUES (1, '1', '$2a$10$o./zkvxgXZraArRE81Y1m.rg1yKkrwr8uOVWqst34taGEjKPvM0jK', 'coach', 1, '2025-03-06', 'd', '2025-03-08 20:24:09', 0, '1dada');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
