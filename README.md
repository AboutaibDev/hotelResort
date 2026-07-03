# Amanora Resort - Hotel Booking System

A modern hotel booking system built with Next.js, featuring room reservations, activity bookings, Google Sheets integration for entertainment/menu/special requests, and an admin dashboard for managing operations.

## Features

- 🏨 **Room Booking**: Browse rooms, check availability, make reservations
- 🎉 **Activities**: Book resort activities
- 📊 **Admin Dashboard**: Manage bookings, users, payments, and more
- 📈 **Google Sheets Integration**: Dynamic entertainment schedule, restaurant menu, and special requests management
- 💬 **Voice Assistant**: AI-powered customer support via Vapi
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MySQL (via Prisma ORM)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **AI Integration**: Vapi (Voice Assistant)
- **Google Sheets API**: For dynamic entertainment/menu/requests
- **WebSockets**: Real-time notifications

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL server (local or remote)
- Google Cloud project (for Sheets API)
- Vapi account (for voice assistant)

### 1. Installation

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root and configure:

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/amanora_resort_pfc"

# Auth
JWT_SECRET="your-jwt-secret-here"

# Vapi (Voice Assistant)
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your-vapi-public-key"
NEXT_PUBLIC_VAPI_ASSISTANT_ID="your-vapi-assistant-id"

# Google Sheets
# Option 1: API Key for read-only access
GOOGLE_API_KEY="your-google-api-key"

# Option 2: Service Account for full CRUD (recommended)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Google Sheet Tab Names
GOOGLE_SHEET_ENTERTAINMENT_TAB="Special_Events"
GOOGLE_SHEET_MENU_TAB="Special_Foods"
GOOGLE_SHEET_REQUESTS_TAB="Special_Request"
```

### 3. Database Setup

```bash
# Run Prisma migrations
npx prisma db push
```

### 4. Run the Development Server

```bash
npm run dev
# or with WebSocket server (for notifications)
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Default Admin Account

(You can create an admin via the database directly)

## Google Sheets Setup

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. For read-only access: Create an API key
4. For full CRUD:
   - Create a service account
   - Download the private key
   - Share your Google Sheet with the service account email
   - Give the account "Editor" access

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Utility functions, database, Google Sheets integration
- `prisma/` - Prisma schema
- `public/` - Static assets
- `server/` - WebSocket server for notifications

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
