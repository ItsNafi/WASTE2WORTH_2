-- ============================================================
-- WASTE2WORTH Master Database Schema
-- Complete, Consolidated Schema for All Features & Roles
-- Compatible with MySQL 5.7+ / MariaDB / MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS `waste2worth` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `waste2worth`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Citizen','Volunteer','BhangariShop','Creator','Admin') DEFAULT 'Citizen',
  `greenPoints` int(11) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: volunteerprofiles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `volunteerprofiles`;
CREATE TABLE `volunteerprofiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `fullName` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `skills` text DEFAULT NULL,
  `interests` text DEFAULT NULL,
  `availability` enum('Weekdays','Weekends','Both','Flexible') DEFAULT 'Flexible',
  `experience` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  KEY `idx_volunteer_user` (`userId`),
  KEY `idx_volunteer_status` (`status`),
  CONSTRAINT `volunteerprofiles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: volunteermedals
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `volunteermedals`;
CREATE TABLE `volunteermedals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `volunteerId` int(11) NOT NULL,
  `adminId` int(11) NOT NULL,
  `medalKey` varchar(50) NOT NULL,
  `medalName` varchar(100) NOT NULL,
  `medalIcon` varchar(10) NOT NULL,
  `reason` text DEFAULT NULL,
  `pointsBonus` int(11) DEFAULT 50,
  `awardedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `adminId` (`adminId`),
  KEY `idx_medals_volunteer` (`volunteerId`),
  CONSTRAINT `volunteermedals_ibfk_1` FOREIGN KEY (`volunteerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteermedals_ibfk_2` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: creatorprofiles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `creatorprofiles`;
CREATE TABLE `creatorprofiles` (
  `creatorId` int(11) NOT NULL,
  `bio` text DEFAULT NULL COMMENT 'Short bio / tagline shown on storefront',
  `story` text DEFAULT NULL COMMENT 'Longer personal upcycling journey story',
  `avatarUrl` varchar(255) DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`creatorId`),
  CONSTRAINT `creatorprofiles_ibfk_1` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: adminactivities
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `adminactivities`;
CREATE TABLE `adminactivities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(60) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `activityDate` date DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdBy` int(10) unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_act_active` (`isActive`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: ecoactivities
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `ecoactivities`;
CREATE TABLE `ecoactivities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(10) unsigned NOT NULL,
  `activityId` int(10) unsigned DEFAULT NULL,
  `activityType` varchar(60) NOT NULL,
  `description` text DEFAULT NULL,
  `activityDate` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Completed',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ea_user` (`userId`),
  KEY `idx_ea_user_status` (`userId`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Table: ecobadges
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `ecobadges`;
CREATE TABLE `ecobadges` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(10) unsigned NOT NULL,
  `badgeKey` varchar(40) NOT NULL,
  `earnedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_badge` (`userId`,`badgeKey`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Table: cleanupcampaigns
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cleanupcampaigns`;
CREATE TABLE `cleanupcampaigns` (
  `campaignId` int(11) NOT NULL AUTO_INCREMENT,
  `organizerId` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `date` date NOT NULL,
  `boundaryZone` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `participantCap` int(11) NOT NULL,
  `currentVolunteers` int(11) DEFAULT 0,
  `status` enum('Upcoming','Active','Completed') DEFAULT 'Upcoming',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`campaignId`),
  KEY `fk_campaign_organizer` (`organizerId`),
  CONSTRAINT `fk_campaign_organizer` FOREIGN KEY (`organizerId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: campaignregistrations
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `campaignregistrations`;
CREATE TABLE `campaignregistrations` (
  `registrationId` int(11) NOT NULL AUTO_INCREMENT,
  `campaignId` int(11) NOT NULL,
  `volunteerId` int(11) NOT NULL,
  `status` enum('Registered','Attended') DEFAULT 'Registered',
  `wasteCollectedKg` decimal(10,2) DEFAULT 0.00,
  `registeredAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`registrationId`),
  UNIQUE KEY `unique_registration` (`campaignId`,`volunteerId`),
  KEY `volunteerId` (`volunteerId`),
  CONSTRAINT `campaignregistrations_ibfk_1` FOREIGN KEY (`campaignId`) REFERENCES `cleanupcampaigns` (`campaignId`) ON DELETE CASCADE,
  CONSTRAINT `campaignregistrations_ibfk_2` FOREIGN KEY (`volunteerId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: wastelogs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `wastelogs`;
CREATE TABLE `wastelogs` (
  `logId` int(11) NOT NULL AUTO_INCREMENT,
  `volunteerId` int(11) NOT NULL,
  `driveId` int(11) DEFAULT NULL COMMENT 'FK to CleanupCampaigns; NULL if not tied to an organised drive',
  `category` enum('Plastic','Metal','Paper','Glass','E-Waste','Textile','Organic','Other') NOT NULL,
  `weightKg` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `collectedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Pending','Verified','Claimed') DEFAULT 'Pending',
  PRIMARY KEY (`logId`),
  KEY `idx_wastelogs_volunteer` (`volunteerId`),
  KEY `idx_wastelogs_drive` (`driveId`),
  KEY `idx_wastelogs_category` (`category`),
  KEY `idx_wastelogs_status` (`status`),
  CONSTRAINT `wastelogs_ibfk_1` FOREIGN KEY (`volunteerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wastelogs_ibfk_2` FOREIGN KEY (`driveId`) REFERENCES `cleanupcampaigns` (`campaignId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: wasterequests
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `wasterequests`;
CREATE TABLE `wasterequests` (
  `requestId` int(11) NOT NULL AUTO_INCREMENT,
  `requesterId` int(11) NOT NULL,
  `logId` int(11) NOT NULL,
  `quantityKg` decimal(10,2) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  `requestedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`requestId`),
  KEY `idx_wastereq_requester` (`requesterId`),
  KEY `idx_wastereq_log` (`logId`),
  CONSTRAINT `wasterequests_ibfk_1` FOREIGN KEY (`requesterId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wasterequests_ibfk_2` FOREIGN KEY (`logId`) REFERENCES `wastelogs` (`logId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: scraplistings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `scraplistings`;
CREATE TABLE `scraplistings` (
  `listingId` int(11) NOT NULL AUTO_INCREMENT,
  `ownerId` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `status` enum('Available','Reserved','Sold') DEFAULT 'Available',
  `photoUrl` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`listingId`),
  KEY `idx_scrap_status` (`status`),
  KEY `idx_scrap_owner` (`ownerId`),
  KEY `idx_scrap_category` (`category`),
  CONSTRAINT `scraplistings_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: upcycledcrafts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `upcycledcrafts`;
CREATE TABLE `upcycledcrafts` (
  `craftId` int(11) NOT NULL AUTO_INCREMENT,
  `creatorId` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `inventoryCount` int(11) DEFAULT 1,
  `beforePhotoUrl` varchar(255) DEFAULT NULL,
  `afterPhotoUrl` varchar(255) DEFAULT NULL,
  `storyNarrative` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `creationDate` date DEFAULT NULL COMMENT 'When the physical item was made',
  `careInstructions` text DEFAULT NULL COMMENT 'How to take care of the item',
  `origin` varchar(255) DEFAULT NULL COMMENT 'Where the waste came from',
  `materialsUsed` varchar(255) DEFAULT NULL COMMENT 'List of raw materials used',
  `transformation` text DEFAULT NULL COMMENT 'How waste became a product',
  `unitsRecycled` int(11) DEFAULT NULL COMMENT 'Number of units recycled (e.g. 48 bottles)',
  `wasteKgDiverted` decimal(8,2) DEFAULT NULL COMMENT 'kg of waste kept out of landfill',
  `environmentalNote` text DEFAULT NULL COMMENT 'Other env. impact notes',
  `creatorLabel` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL COMMENT 'Product category (Home Decor, Fashion, etc.)',
  PRIMARY KEY (`craftId`),
  KEY `idx_craft_creator` (`creatorId`),
  CONSTRAINT `upcycledcrafts_ibfk_1` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: craftreviews
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `craftreviews`;
CREATE TABLE `craftreviews` (
  `reviewId` int(11) NOT NULL AUTO_INCREMENT,
  `craftId` int(11) NOT NULL,
  `reviewerName` varchar(100) NOT NULL,
  `reviewText` text NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`reviewId`),
  KEY `craftId` (`craftId`),
  CONSTRAINT `craftreviews_ibfk_1` FOREIGN KEY (`craftId`) REFERENCES `upcycledcrafts` (`craftId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: recyclinghistory
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `recyclinghistory`;
CREATE TABLE `recyclinghistory` (
  `historyId` int(11) NOT NULL AUTO_INCREMENT,
  `creatorId` int(11) NOT NULL,
  `craftId` int(11) DEFAULT NULL,
  `eventDate` date NOT NULL,
  `recycledKg` decimal(10,2) DEFAULT 0.00,
  `materials` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`historyId`),
  KEY `craftId` (`craftId`),
  KEY `idx_recycling_creator` (`creatorId`),
  CONSTRAINT `recyclinghistory_ibfk_1` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recyclinghistory_ibfk_2` FOREIGN KEY (`craftId`) REFERENCES `upcycledcrafts` (`craftId`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: pollutioncomplaints
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pollutioncomplaints`;
CREATE TABLE `pollutioncomplaints` (
  `complaintId` int(11) NOT NULL AUTO_INCREMENT,
  `citizenId` int(11) NOT NULL,
  `locationPin` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `status` enum('Reported','Investigating','Resolved') DEFAULT 'Reported',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`complaintId`),
  KEY `citizenId` (`citizenId`),
  CONSTRAINT `pollutioncomplaints_ibfk_1` FOREIGN KEY (`citizenId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: pricedirectory
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pricedirectory`;
CREATE TABLE `pricedirectory` (
  `categoryId` int(11) NOT NULL AUTO_INCREMENT,
  `categoryName` varchar(100) NOT NULL,
  `pricePerKg` decimal(10,2) NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `displayCategory` varchar(50) DEFAULT 'Other',
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT '♻️',
  `isActive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`categoryId`),
  UNIQUE KEY `categoryName` (`categoryName`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: notifications
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: payments
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `paymentId` int(11) NOT NULL AUTO_INCREMENT,
  `senderId` int(11) NOT NULL,
  `receiverId` int(11) DEFAULT NULL COMMENT 'NULL if Centralized Cleanup Campaign Fund',
  `amount` decimal(10,2) NOT NULL,
  `type` enum('BhangariToCitizen','BhangariToVolunteer','CustomerCheckout') NOT NULL,
  `referenceId` int(11) NOT NULL COMMENT 'scrapId, campaignRegistrationId, or craftId',
  `status` enum('Pending','Completed','Failed') DEFAULT 'Completed',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`paymentId`),
  KEY `idx_payments_sender` (`senderId`),
  KEY `idx_payments_receiver` (`receiverId`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Initial Seed Data
-- ============================================================

-- 1. Default Admin User (admin@factory.com / admin123)
-- Password hash: bcrypt for 'admin123'
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `greenPoints`) VALUES
(1, 'Admin', 'admin@factory.com', '$2a$10$wB50PZkOqX4iK5Gk7N/3aOI6aNfx77h5Usq5uG9g9oA0tGkK6iZgK', 'Admin', 500)
ON DUPLICATE KEY UPDATE `role` = 'Admin';

-- 2. Default Price Directory Benchmark Materials
INSERT INTO `pricedirectory` (`categoryName`, `displayCategory`, `pricePerKg`, `isActive`, `description`, `icon`) VALUES
('PET Plastic Bottles', 'Plastic', 25.00, 1, 'Clear beverage containers and rigid packaging', '🧴'),
('Aluminium Cans', 'Metal', 120.00, 1, 'Beverage cans and clean sheet scraps', '🥫'),
('Copper Wire (Bright)', 'Metal', 850.00, 1, 'Stripped high-grade electrical conductors', '⚡'),
('Cardboard & Cartons', 'Paper', 14.00, 1, 'Clean corrugated boxes and packaging packaging', '📦'),
('White Office Paper', 'Paper', 22.00, 1, 'Sorted printed and virgin office stationery', '📄'),
('Glass Bottles (Sorted)', 'Glass', 8.00, 1, 'Intact beer, beverage, and sauce bottles', '🍾'),
('E-Waste (Motherboards)', 'E-Waste', 350.00, 1, 'Obsolete computers, phones, circuit components', '💻'),
('Textile Scraps (Cotton)', 'Textile', 18.00, 1, 'Garment cutting remnants from factories', '👕'),
('Iron / Steel Scrap', 'Metal', 45.00, 1, 'Heavy structural steel and discarded iron rods', '🔩'),
('HDPE Hard Plastic', 'Plastic', 32.00, 1, 'Detergent bottles, crates, shampoo containers', '🛢️')
ON DUPLICATE KEY UPDATE `pricePerKg` = VALUES(`pricePerKg`);

-- 3. Default Environmental Activities for Volunteers
INSERT INTO `adminactivities` (`id`, `title`, `category`, `description`, `location`, `activityDate`, `isActive`, `createdBy`) VALUES
(1, 'Community Plastic & Bottle Cleanup', 'Waste Collection', 'Collect and sort recyclable plastic bottles and containers in Gulshan Park.', 'Gulshan Lake Park, Dhaka', '2026-09-10', 1, 1),
(2, 'Urban Greenery & Tree Planting Drive', 'Tree Planting', 'Plant native trees and saplings to restore green cover in Mirpur.', 'Mirpur Botanical Garden Area', '2026-09-15', 1, 1),
(3, 'E-Waste & Electronics Collection Camp', 'Recycling', 'Help citizens drop off broken electronics, batteries, and wires safely.', 'Dhanmondi Community Center', '2026-09-20', 1, 1),
(4, 'Upcycled Craft Workshop Assistance', 'Reuse/Upcycling', 'Assist local artisans in turning textile and paper waste into reusable home products.', 'Banani Craft Hub', '2026-09-25', 1, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
