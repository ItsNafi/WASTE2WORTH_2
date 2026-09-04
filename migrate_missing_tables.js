const pool = require('./config/db');
const migrations = [
  { name: 'volunteermedals', sql: `CREATE TABLE IF NOT EXISTS \`volunteermedals\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`volunteerId\` int(11) NOT NULL,
  \`adminId\` int(11) NOT NULL,
  \`medalKey\` varchar(50) NOT NULL,
  \`medalName\` varchar(100) NOT NULL,
  \`medalIcon\` varchar(10) NOT NULL,
  \`reason\` text DEFAULT NULL,
  \`pointsBonus\` int(11) DEFAULT 50,
  \`awardedAt\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`adminId\` (\`adminId\`),
  KEY \`idx_medals_volunteer\` (\`volunteerId\`),
  CONSTRAINT \`volunteermedals_ibfk_1\` FOREIGN KEY (\`volunteerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`volunteermedals_ibfk_2\` FOREIGN KEY (\`adminId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` },
  { name: 'adminactivities', sql: `CREATE TABLE IF NOT EXISTS \`adminactivities\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`category\` varchar(60) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`location\` varchar(255) DEFAULT NULL,
  \`activityDate\` date DEFAULT NULL,
  \`isActive\` tinyint(1) NOT NULL DEFAULT 1,
  \`createdBy\` int(10) unsigned NOT NULL,
  \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
  \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`idx_act_active\` (\`isActive\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` },
  { name: 'ecoactivities', sql: `CREATE TABLE IF NOT EXISTS \`ecoactivities\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`userId\` int(10) unsigned NOT NULL,
  \`activityId\` int(10) unsigned DEFAULT NULL,
  \`activityType\` varchar(60) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`activityDate\` date NOT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'Completed',
  \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`idx_ea_user\` (\`userId\`),
  KEY \`idx_ea_user_status\` (\`userId\`,\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci` },
  { name: 'ecobadges', sql: `CREATE TABLE IF NOT EXISTS \`ecobadges\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`userId\` int(10) unsigned NOT NULL,
  \`badgeKey\` varchar(40) NOT NULL,
  \`earnedAt\` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_user_badge\` (\`userId\`,\`badgeKey\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci` },
  { name: 'craftreviews', sql: `CREATE TABLE IF NOT EXISTS \`craftreviews\` (
  \`reviewId\` int(11) NOT NULL AUTO_INCREMENT,
  \`craftId\` int(11) NOT NULL,
  \`reviewerName\` varchar(100) NOT NULL,
  \`reviewText\` text NOT NULL,
  \`rating\` int(11) DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (\`reviewId\`),
  KEY \`craftId\` (\`craftId\`),
  CONSTRAINT \`craftreviews_ibfk_1\` FOREIGN KEY (\`craftId\`) REFERENCES \`upcycledcrafts\` (\`craftId\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` }
];
async function run() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('DB connected.');
    for (const m of migrations) {
      try { await conn.query(m.sql); console.log('OK:', m.name); }
      catch(e) { console.error('FAIL:', m.name, e.message); }
    }
    const names = migrations.map(m=>m.name);
    const [rows] = await conn.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('+names.map(()=>'?').join(',')+')', names);
    const found = rows.map(r=>r.TABLE_NAME);
    names.forEach(t=>console.log((found.includes(t)?'EXISTS':'MISSING'), t));
  } finally { if(conn) conn.release(); process.exit(0); }
}
run().catch(e=>{console.error(e);process.exit(1);});
