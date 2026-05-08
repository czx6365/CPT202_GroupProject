CREATE DATABASE IF NOT EXISTS `CPT202_Project_DB`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `CPT202_Project_DB`;

CREATE TABLE IF NOT EXISTS `tb_user` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role_type` VARCHAR(50) NOT NULL,
  `contributor_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `contributor_application` TEXT DEFAULT NULL,
  `contributor_requested_at` DATETIME(6) DEFAULT NULL,
  `contributor_rejection_reason` TEXT DEFAULT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_tb_user_user_name` (`user_name`),
  UNIQUE KEY `uk_tb_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_category` (
  `category_id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_tb_category_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_tag` (
  `tag_id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `uk_tb_tag_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_resource` (
  `resource_id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `topic` VARCHAR(255) DEFAULT NULL,
  `place_name` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `file_url` VARCHAR(1000) DEFAULT NULL,
  `file_link_url` VARCHAR(1000) DEFAULT NULL,
  `external_link` VARCHAR(255) DEFAULT NULL,
  `copyright_declaration` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL,
  `reviewer_feedback` TEXT DEFAULT NULL,
  `contributor_id` BIGINT NOT NULL,
  `reviewer_id` BIGINT DEFAULT NULL,
  `category_id` BIGINT DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  `reviewed_at` DATETIME(6) DEFAULT NULL,
  `published_at` DATETIME(6) DEFAULT NULL,
  `archived_at` DATETIME(6) DEFAULT NULL,
  PRIMARY KEY (`resource_id`),
  KEY `idx_tb_resource_contributor` (`contributor_id`),
  KEY `idx_tb_resource_reviewer` (`reviewer_id`),
  KEY `idx_tb_resource_category` (`category_id`),
  CONSTRAINT `fk_tb_resource_contributor`
    FOREIGN KEY (`contributor_id`) REFERENCES `tb_user` (`user_id`),
  CONSTRAINT `fk_tb_resource_reviewer`
    FOREIGN KEY (`reviewer_id`) REFERENCES `tb_user` (`user_id`),
  CONSTRAINT `fk_tb_resource_category`
    FOREIGN KEY (`category_id`) REFERENCES `tb_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_resource_file` (
  `file_id` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `content_type` VARCHAR(255) NOT NULL,
  `data` LONGBLOB NOT NULL,
  `uploaded_by_user_id` BIGINT DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`file_id`),
  KEY `idx_tb_resource_file_uploaded_by` (`uploaded_by_user_id`),
  CONSTRAINT `fk_tb_resource_file_uploaded_by`
    FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `tb_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_resource_tag_rel` (
  `resource_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  PRIMARY KEY (`resource_id`, `tag_id`),
  KEY `idx_tb_resource_tag_rel_tag` (`tag_id`),
  CONSTRAINT `fk_tb_resource_tag_rel_resource`
    FOREIGN KEY (`resource_id`) REFERENCES `tb_resource` (`resource_id`),
  CONSTRAINT `fk_tb_resource_tag_rel_tag`
    FOREIGN KEY (`tag_id`) REFERENCES `tb_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_resource_comment` (
  `comment_id` BIGINT NOT NULL AUTO_INCREMENT,
  `resource_id` BIGINT NOT NULL,
  `author_id` BIGINT NOT NULL,
  `content` VARCHAR(2000) NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `idx_tb_resource_comment_resource` (`resource_id`),
  KEY `idx_tb_resource_comment_author` (`author_id`),
  CONSTRAINT `fk_tb_resource_comment_resource`
    FOREIGN KEY (`resource_id`) REFERENCES `tb_resource` (`resource_id`),
  CONSTRAINT `fk_tb_resource_comment_author`
    FOREIGN KEY (`author_id`) REFERENCES `tb_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_announcement` (
  `announcement_id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `audience` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `created_by` BIGINT NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`announcement_id`),
  KEY `idx_tb_announcement_created_by` (`created_by`),
  CONSTRAINT `fk_tb_announcement_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `tb_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tb_audit_log` (
  `audit_log_id` BIGINT NOT NULL AUTO_INCREMENT,
  `operator_id` BIGINT DEFAULT NULL,
  `operator_name` VARCHAR(255) NOT NULL,
  `module` VARCHAR(255) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target_type` VARCHAR(255) NOT NULL,
  `target_id` BIGINT DEFAULT NULL,
  `target_name` VARCHAR(255) DEFAULT NULL,
  `detail` TEXT DEFAULT NULL,
  `status` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`audit_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tb_resource_file`
  MODIFY `data` LONGBLOB NOT NULL;

ALTER TABLE `tb_resource`
  MODIFY `file_url` VARCHAR(1000) DEFAULT NULL;

SET @file_link_url_column_count := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tb_resource'
    AND COLUMN_NAME = 'file_link_url'
);

SET @add_file_link_url_column := IF(
  @file_link_url_column_count = 0,
  'ALTER TABLE `tb_resource` ADD COLUMN `file_link_url` VARCHAR(1000) DEFAULT NULL AFTER `file_url`',
  'SELECT 1'
);

PREPARE add_file_link_url_column_stmt FROM @add_file_link_url_column;
EXECUTE add_file_link_url_column_stmt;
DEALLOCATE PREPARE add_file_link_url_column_stmt;

INSERT IGNORE INTO `tb_category` (`name`, `description`) VALUES
  ('Historic Site', 'Places or landmarks with local historical value.'),
  ('Festival', 'Festivals, celebrations, and recurring local cultural events.'),
  ('Oral History', 'Interviews, narratives, and recorded memories from the community.');

INSERT IGNORE INTO `tb_tag` (`name`) VALUES
  ('photo'),
  ('archive'),
  ('interview'),
  ('local-memory');
