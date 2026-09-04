# ♻️ WASTE2WORTH - Circular Economy Platform

WASTE2WORTH is a full-stack circular-economy web platform that helps communities reduce waste by connecting citizens, scrap collection shops, creators, volunteers, and administrators.

The platform supports recyclable material exchange, pollution reporting, cleanup campaigns, volunteer recognition, and a storefront for products made from upcycled materials.

**Status:** 🚀 Active development
**Version:** 1.0.0

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Development Status](#-development-status)
- [Contributing](#-contributing)
- [Support](#-support)
- [Authors](#-authors)

## 🎯 Overview

WASTE2WORTH addresses common challenges in waste management and community sustainability:

- **Waste exchange:** Citizens can list recyclable materials for collection or purchase.
- **Responsible disposal:** Citizens can report pollution and request waste-management support.
- **Upcycling marketplace:** Creators can transform recovered materials into products and publish them in a public storefront.
- **Community action:** Volunteers can register for cleanup activities, record attendance, and track their environmental contributions.
- **Impact visibility:** Administrators can manage campaigns, prices, volunteers, activities, and environmental impact data.

The system provides role-specific workflows for `Citizen`, `BhangariShop`, `Creator`, `Volunteer`, and `Admin` users.

## ✨ Features

### 1. Authentication and User Management

- Registration and login with role selection
- Password hashing with `bcryptjs`
- JWT authentication through HTTP-only cookies
- Role-based page and API authorization
- Account role updates and authenticated user profile lookup

### 2. Citizen Waste Workflows

- Create and manage scrap listings with photos
- View material prices and available listings
- Track personal recycling history
- Submit pollution complaints with location, description, and photo
- Submit waste requests and monitor their status
- View environmental heatmap data

### 3. BhangariShop Collection and Payments

- Browse citizen and campaign waste listings
- Purchase scrap materials from citizens
- Purchase verified campaign waste
- View campaign fund and transaction information
- Manage collection activity through protected shop workflows

### 4. Creator Storefront

- Manage raw-material purchases
- Create upcycled craft listings with before and after photos
- Add product stories, materials, origin, and environmental impact details
- Manage inventory and restock products
- Browse creator profiles and published crafts
- Receive product reviews and track sales

### 5. Volunteer Campaigns and Recognition

- Create and manage volunteer profiles
- Browse and register for cleanup campaigns
- Generate campaign QR codes and scan attendance
- Record waste collected during activities
- Download reward certificates
- Earn badges and medals for environmental activities

### 6. Administration and Impact Monitoring

- View dashboard metrics and impact statistics
- Create cleanup campaigns and manage campaign data
- Manage the recyclable-material price directory
- Review volunteers, waste requests, complaints, and activities
- Manage badges and medals
- View impact dashboards and heatmap data
- Manage notifications and campaign funds

## 🛠 Tech Stack

### Backend

- Node.js
- Express 5
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs` for password hashing
- `cookie-parser` for authentication cookies
- `multer` for image and file uploads
- `pdfkit` for reward certificates
- `qrcode` for campaign attendance QR codes

### Database

- MySQL or MariaDB
- `mysql2/promise` connection pool
- Environment-based database configuration with `dotenv`

### Frontend

- HTML5 views served by Express
- CSS3
- Vanilla JavaScript
- Static assets served from `public/`

## 📁 Project Structure

```text
WASTE2WORTH_2/
├── app.js                         # Express application and route registration
├── server.js                      # HTTP server startup and port fallback
├── package.json                   # Dependencies and npm scripts
├── config/
│   └── db.js                      # MySQL connection pool
├── controllers/                   # Request handlers and business logic
├── middleware/                    # Auth, role, and upload middleware
├── models/                        # Database access modules
├── routes/                        # API route definitions
├── utils/                         # Rewards, scoring, payments, and PDF helpers
├── views/                         # HTML pages grouped by user role
├── public/                        # CSS, client JavaScript, and uploads
├── schema.sql                     # Consolidated database schema and seed data
├── schema-phase7-duration.sql    # Campaign duration migration
└── migrate_missing_tables.js      # Creates tables added after the base schema
```

## 🚀 Installation and Setup

### Prerequisites

- Node.js 18 or newer
- MySQL 5.7+, MySQL 8+, or a compatible MariaDB server
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/ItsNafi/WASTE2WORTH_2.git
cd WASTE2WORTH_2
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure the Database

Create a MySQL database, or use the database name configured in `.env`. The included schema creates `waste2worth` automatically.

Load the consolidated schema:

```bash
mysql -u <user> -p < schema.sql
```

Apply the campaign-duration migration when required:

```bash
mysql -u <user> -p < schema-phase7-duration.sql
```

Create any additional feature tables that are missing:

```bash
node migrate_missing_tables.js
```

### Step 4: Configure Environment Variables

Copy the example file:

```bash
copy .env.example .env
```

Configure the values for your environment:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=waste2worth
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | MySQL server host |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | empty | MySQL password |
| `DB_NAME` | `waste2worth` | Database name |
| `JWT_SECRET` | development fallback | Secret used to sign authentication cookies |
| `PORT` | `3000` | HTTP server port |

### Step 5: Start the Server

Start normally:

```bash
npm start
```

Start with Node's built-in file watcher during development:

```bash
npm run dev
```

The application is available at `http://localhost:3000`. If that port is busy, the server tries the next available port.

## 💻 Usage Guide

### Citizens

1. Register as a `Citizen` and log in.
2. Open the citizen dashboard to create a scrap listing.
3. Check the price directory and available material listings.
4. Submit pollution complaints or waste requests when needed.
5. Track recycling history, notifications, and earned environmental rewards.

### Bhangari Shops

1. Log in with a `BhangariShop` account.
2. Open the shop board to view available scrap and campaign waste.
3. Purchase eligible material through the payment workflow.
4. Review transactions and campaign-fund activity.

### Creators

1. Register or log in as a `Creator`.
2. Review available raw materials.
3. Publish crafts with photos, pricing, inventory, and transformation details.
4. Restock products, monitor sales, and manage creator reviews.

### Volunteers

1. Log in and complete a volunteer profile.
2. Browse and register for cleanup campaigns.
3. Attend campaigns using the QR attendance workflow.
4. Record environmental activities and waste collected.
5. View achievements and download certificates.

### Administrators

1. Log in with an `Admin` account.
2. Use the admin dashboard to manage campaigns, volunteers, prices, and activities.
3. Review pollution reports, waste requests, and impact metrics.
4. Award or revoke volunteer badges and medals.

## 📡 API Documentation

API routes are mounted under `/api`. Protected routes require the authentication cookie created during login and may require a specific role.

### Authentication

```text
POST /api/auth/register       Register a user
POST /api/auth/login          Log in and create an auth cookie
GET  /api/auth/logout         Log out
GET  /api/auth/me             Get the authenticated user
PUT  /api/auth/role           Update the authenticated user's role
```

### Waste and Scrap

```text
POST /api/scrap               Create a scrap listing
GET  /api/scrap/my            Get the citizen's listings
GET  /api/scrap/all           Get all listings
GET  /api/scrap/available     Get available listings
POST /api/waste-logs          Record collected waste
GET  /api/waste-logs          Get waste logs
POST /api/waste-requests      Create a waste request
GET  /api/waste-requests/my   Get the citizen's requests
```

### Crafts, Creators, and Payments

```text
GET  /api/crafts              Browse crafts
POST /api/crafts              Create a craft listing
GET  /api/crafts/:craftId     Get a craft
POST /api/crafts/:craftId/restock
GET  /api/creator/materials   Get creator raw materials
GET  /api/creator/:id         Get a creator profile
POST /api/payments/checkout/:craftId
GET  /api/payments/my         Get the user's transactions
```

### Campaigns and Volunteers

```text
GET  /api/campaigns           List campaigns
POST /api/campaigns/:campaignId/register
POST /api/volunteers/register Create a volunteer profile
GET  /api/volunteers/me       Get the volunteer profile
GET  /api/volunteers          Admin volunteer list
GET  /api/campaigns/:id/qr-code
POST /api/attendance/scan     Scan campaign attendance
GET  /api/rewards/certificate Download a reward certificate
```

### Administration and Impact

```text
GET  /api/admin/dashboard     Admin dashboard metrics
GET  /api/admin/impact-stats  Impact statistics
POST /api/admin/campaigns     Create a campaign
GET  /api/price-directory     Public price directory
POST /api/price-directory     Add a material price
GET  /api/heatmap-data        Environmental heatmap data
GET  /api/admin/activities    List environmental activities
```

The complete endpoint behavior is defined in the files under `routes/` and `controllers/`.

## 🗄️ Database Schema

The consolidated `schema.sql` creates the `waste2worth` database, core tables, foreign keys, indexes, and initial seed data.

### Identity and Profiles

- `users` - accounts, roles, passwords, and green points
- `volunteerprofiles` - volunteer contact details and availability
- `creatorprofiles` - creator bios, stories, and avatars

### Waste and Recycling

- `scraplistings` - citizen recyclable-material listings
- `wastelogs` - waste collected by volunteers or drives
- `wasterequests` - requests for logged waste
- `recyclinghistory` - creator recycling activity
- `pollutioncomplaints` - citizen pollution reports
- `pricedirectory` - material prices and categories

### Campaigns and Recognition

- `cleanupcampaigns` - organized cleanup events
- `campaignregistrations` - volunteer campaign registration and attendance
- `adminactivities` - administrator-created environmental activities
- `ecoactivities` and `ecobadges` - volunteer activity and badge records
- `volunteermedals` - administrator-awarded volunteer medals

### Marketplace and Platform Services

- `upcycledcrafts` - creator products and environmental impact details
- `craftreviews` - product reviews
- `payments` - marketplace and campaign transactions
- `notifications` - user notifications

The initial seed data includes a default admin account, benchmark material prices, and sample environmental activities. Change default credentials before using the application outside development.

## 🔐 Security

- Passwords are hashed before storage with `bcryptjs`.
- JWT authentication is stored in HTTP-only cookies.
- Role middleware protects restricted pages and API actions.
- Database access uses the MySQL promise pool and parameterized queries in the model layer.
- Uploads are handled through dedicated `multer` middleware.
- Secrets and database credentials are loaded through environment variables.

For production, set a strong unique `JWT_SECRET`, use secure database credentials, enable HTTPS, and review upload and cookie settings for the deployment environment.

## 📊 Development Status

### ✅ Implemented

- Multi-role registration and authentication
- Citizen scrap and pollution workflows
- BhangariShop material purchase flows
- Creator craft storefront and product stories
- Campaign registration and attendance scanning
- Volunteer profiles, certificates, badges, and medals
- Admin pricing, campaign, activity, and impact dashboards
- Payment, notification, heatmap, and recycling-history endpoints

### 🔄 Ongoing Improvements

- Expand automated test coverage
- Improve production payment integration
- Continue refining dashboard UX and validation
- Add more operational reporting and analytics

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make focused changes that follow the existing project structure.
4. Validate the application locally.
5. Commit and push your branch:

   ```bash
   git add .
   git commit -m "Describe your change"
   git push origin feature/your-feature
   ```

6. Open a pull request with a clear description and testing notes.

## 📞 Support

For bugs or feature requests, use the [GitHub Issues](https://github.com/ItsNafi/WASTE2WORTH_2/issues) page. For code changes, open a pull request against the `main` branch.

## 👨‍💻 Authors

- [ItsNafi](https://github.com/ItsNafi)
- [33sakib33](https://github.com/33sakib33)

## 🔗 Repository Links

- [Repository](https://github.com/ItsNafi/WASTE2WORTH_2)
- [Issues](https://github.com/ItsNafi/WASTE2WORTH_2/issues)
- [Pull Requests](https://github.com/ItsNafi/WASTE2WORTH_2/pulls)

## 🙏 Acknowledgments

- Express.js and Node.js communities
- MySQL and `mysql2` documentation
- Contributors who helped shape the platform's recycling, marketplace, and volunteer workflows
