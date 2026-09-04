# WASTE2WORTH

WASTE2WORTH is a circular-economy platform that connects citizens, scrap collection shops, creators, volunteers, and administrators. Users can exchange recyclable materials, report pollution, join cleanup campaigns, and discover products made from upcycled materials.

## Features

- Role-based access for `Citizen`, `BhangariShop`, `Creator`, `Volunteer`, and `Admin`
- JWT authentication stored in HTTP-only cookies
- Scrap listings, collection workflows, and recycling history
- Upcycled craft listings, storefront browsing, reviews, and payments
- Pollution reports, waste portal requests, and impact heatmaps
- Cleanup campaigns, volunteer attendance, QR scanning, certificates, badges, and medals
- Admin dashboards for campaigns, pricing, volunteers, activities, and impact metrics

## Tech Stack

- Node.js and Express 5
- MySQL with `mysql2`
- JWT, `bcryptjs`, and `cookie-parser` for authentication
- `multer` for uploads
- `pdfkit` for generated certificates
- Vanilla HTML, CSS, and JavaScript for the frontend

## Prerequisites

- Node.js 18 or newer
- MySQL 8 or a compatible MySQL server

## Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create a MySQL database named `waste2worth` (or choose another name in `.env`).

3. Copy `.env.example` to `.env` and set the database credentials and a production-safe JWT secret:

	```bash
	copy .env.example .env
	```

	The available variables are:

	| Variable | Default | Description |
	| --- | --- | --- |
	| `DB_HOST` | `localhost` | MySQL host |
	| `DB_USER` | `root` | MySQL user |
	| `DB_PASSWORD` | empty | MySQL password |
	| `DB_NAME` | `waste2worth` | MySQL database |
	| `JWT_SECRET` | development fallback | Secret used to sign login cookies |
	| `PORT` | `3000` | HTTP server port |

4. Load the base schema:

	```bash
	mysql -u <user> -p < schema.sql
	```

5. Apply the duration migration if the database includes cleanup campaign attendance:

	```bash
	mysql -u <user> -p < schema-phase7-duration.sql
	```

6. Create additional tables used by newer features, if they are not already present:

	```bash
	node migrate_missing_tables.js
	```

7. Start the application:

	```bash
	npm start
	```

	Open `http://localhost:3000` in a browser. The server automatically tries the next port if the configured port is busy.

## Development

Run the server with Node's built-in file watcher:

```bash
npm run dev
```

There is currently no automated test script in `package.json`.

## Application Routes

- `/login` and `/register` — authentication
- `/storefront` — public upcycled crafts storefront
- `/dashboard/citizen` — citizen scrap and pollution workflows
- `/dashboard/bhangari` — scrap collection shop dashboard
- `/dashboard/creator` — creator materials and crafts
- `/volunteer/profile` and `/volunteer/campaigns` — volunteer workflows
- `/dashboard/admin` — protected administration dashboard
- `/api/...` — JSON API endpoints for authentication, scrap, crafts, campaigns, pollution, payments, rewards, volunteers, pricing, and analytics

Most dashboards and API endpoints require a valid login cookie and the appropriate role.

## Project Structure

| Path | Purpose |
| --- | --- |
| `app.js` | Express application, middleware, page routes, and API registration |
| `server.js` | HTTP server startup and impact-dashboard handling |
| `routes/` | API route definitions |
| `controllers/` | Request handlers and application logic |
| `models/` | MySQL data-access modules |
| `middleware/` | Authentication, authorization, and upload middleware |
| `views/` | HTML pages served by Express |
| `public/` | Static frontend assets and uploads |
| `utils/` | Shared scoring, payment, reward, and PDF utilities |
| `schema.sql` | Base MySQL schema |
| `schema-phase7-duration.sql` | Cleanup campaign duration and attendance migration |

## Contributors

- [ItsNafi](https://github.com/ItsNafi)
- [33sakib33](https://github.com/33sakib33)

## Repository

[GitHub repository](https://github.com/ItsNafi/WASTE2WORTH)
