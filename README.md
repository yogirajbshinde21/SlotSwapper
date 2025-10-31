# SlotSwapper 🔄

A peer-to-peer time-slot scheduling application that allows users to mark busy calendar slots as "swappable" and exchange them with other users.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Assumptions & Challenges](#assumptions--challenges)
- [Deployment](#deployment)

## 📖 Project Overview

SlotSwapper is a full-stack web application that enables users to exchange busy time slots with each other. Users can create calendar events, mark them as "swappable," browse available slots from other users in a marketplace, and send swap requests. When a swap is accepted, the ownership of both slots automatically transfers.

### Design Choices

1. **Three-State Slot System**: Events can be BUSY (unavailable), SWAPPABLE (available in marketplace), or SWAP_PENDING (locked during negotiation). This prevents conflicts during the swap process.

2. **Atomic Swap Operations**: When a swap is accepted, both slots exchange ownership simultaneously. This ensures data consistency even if errors occur mid-process.

3. **Authorization Layers**: Beyond JWT authentication, each endpoint verifies that users can only modify their own slots and respond to requests addressed to them.

4. **Frontend State Management**: React Context API handles authentication state globally, while local component state manages UI interactions, providing a clean separation of concerns.

5. **RESTful API Design**: Clear endpoint naming and HTTP methods (POST for creation, PATCH for updates, DELETE for removal) following REST conventions.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend**: React.js, React Router, Axios, React Toastify, Context API

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm

### Step 1: Start MongoDB
Ensure MongoDB is running on your machine:
```bash
# Windows - MongoDB usually runs as a service
mongosh  # Verify connection

# Linux/Mac
sudo systemctl start mongod
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file and configure
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Mac/Linux

# Edit .env with these values:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/slotswapper
# JWT_SECRET=your_super_secret_jwt_key_change_this
# JWT_EXPIRE=7d
# NODE_ENV=development

# Start backend server
npm run dev
```
Backend runs on: **http://localhost:5000**

### Step 3: Frontend Setup
Open a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Mac/Linux

# Edit .env:
# REACT_APP_API_URL=http://localhost:5000/api

# Start React app
npm start
```
Frontend runs on: **http://localhost:3000**

### Step 4: Test the Application
1. Open **http://localhost:3000** in your browser
2. Register a new user
3. Create a calendar event
4. Mark it as "Swappable"
5. Open an incognito window, register another user, and test the swap flow

## 📚 API Documentation

**Base URL**: `http://localhost:5000/api`

All endpoints except authentication require the `Authorization: Bearer <token>` header.

### Authentication Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/auth/register` | Register new user | `{ name, email, password }` |
| POST | `/auth/login` | Login user | `{ email, password }` |
| GET | `/auth/me` | Get current user | - |

### Event Endpoints (Protected)

| Method | Endpoint | Description | Request Body | Query Params |
|--------|----------|-------------|--------------|--------------|
| POST | `/events` | Create new event | `{ title, description?, startTime, endTime, location?, status? }` | - |
| GET | `/events` | Get user's events | - | `status`, `startDate`, `endDate` |
| GET | `/events/:id` | Get single event | - | - |
| PATCH | `/events/:id` | Update event | `{ title?, description?, startTime?, endTime?, location?, status? }` | - |
| DELETE | `/events/:id` | Delete event | - | - |
| GET | `/events/swappable/marketplace` | Browse swappable slots | - | - |

### Swap Request Endpoints (Protected)

| Method | Endpoint | Description | Request Body | Query Params |
|--------|----------|-------------|--------------|--------------|
| POST | `/swap-requests` | Create swap request | `{ mySlotId, theirSlotId, message? }` | - |
| GET | `/swap-requests/incoming` | Get received requests | - | `status` |
| GET | `/swap-requests/outgoing` | Get sent requests | - | `status` |
| POST | `/swap-requests/:id/respond` | Accept/Reject swap | `{ response: "ACCEPTED" or "REJECTED" }` | - |
| DELETE | `/swap-requests/:id` | Cancel swap request | - | - |

### Sample Request/Response

**Register User:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

# Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

**Create Event:**
```bash
POST http://localhost:5000/api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Team Meeting",
  "startTime": "2025-11-05T10:00:00Z",
  "endTime": "2025-11-05T11:00:00Z",
  "status": "BUSY"
}
```

**Create Swap Request:**
```bash
POST http://localhost:5000/api/swap-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "mySlotId": "507f1f77bcf86cd799439011",
  "theirSlotId": "507f191e810c19729de860ea",
  "message": "Can we swap? I prefer afternoon slots."
}
```

## 🤔 Assumptions & Challenges

### Assumptions Made

1. **Single Timezone**: The application assumes all users operate in the same timezone. Times are stored as UTC ISO strings but no timezone conversion is performed in the UI.

2. **No Slot Conflicts**: Users can create overlapping events. The application doesn't validate whether a user already has a conflicting slot at the same time.

3. **MongoDB Standalone**: The application is designed for standalone MongoDB instances. Initially attempted to use transactions for atomic operations, but removed them as they require replica sets in production.

4. **Two-Party Swaps Only**: Each swap involves exactly two users exchanging one slot each. No multi-party or one-way transfers are supported.

5. **Immediate Swap Execution**: When a swap is accepted, the transfer happens immediately with no grace period or undo functionality.

6. **No Notification System**: Users must manually check the "Requests" page to see incoming swap requests. No email or push notifications are implemented.

### Challenges Faced

1. **MongoDB Transactions**: Initially implemented MongoDB sessions and transactions for atomic swap operations. However, discovered that standalone MongoDB instances don't support transactions (only replica sets do). Had to remove transaction code and rely on sequential save operations.

2. **ObjectId Comparison**: Encountered authorization bugs where `event.userId !== req.user.userId` always returned true. This was because Mongoose ObjectIds need explicit string conversion with `.toString()` for accurate comparison.

3. **Swap State Management**: Designing the three-state system (BUSY, SWAPPABLE, SWAP_PENDING) required careful consideration of edge cases. For example, preventing users from modifying or deleting slots that are locked in pending swaps.

4. **Bidirectional Relationships**: Managing the relationship between events and swap requests required careful population and cleanup. When a swap request is rejected or cancelled, both related events need their status reset.

5. **Frontend State Synchronization**: After performing actions (create swap, accept request), the UI needed to refresh multiple components (Dashboard, Marketplace, Requests). Solved by forcing component remounts and re-fetching data after mutations.

6. **Authentication Flow**: Implementing token persistence across page refreshes while maintaining security required careful handling of localStorage and axios interceptors for automatic token injection.

### Solutions Implemented

- Removed MongoDB transactions in favor of sequential operations for standalone compatibility
- Added `.toString()` to all ObjectId comparisons in authorization checks
- Implemented status validation middleware to prevent illegal state transitions
- Created comprehensive error handling with descriptive messages for debugging
- Used React's `useEffect` dependencies to trigger re-fetches after state changes
- Implemented axios interceptors for centralized token management and 401 handling

---

## 🚀 Deployment

### Deploy to Microsoft Azure

This project includes comprehensive deployment guides for Microsoft Azure using GitHub Student Developer Pack credits (no credit card required).

**📚 Deployment Resources:**

- **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** - Complete step-by-step deployment guide (~65 min)
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Quick reference checklist (~45 min)
- **[AZURE_ENV_TEMPLATE.md](./AZURE_ENV_TEMPLATE.md)** - Environment variables template

**What You'll Deploy:**
- ✅ Backend API → Azure App Service (Node.js) - FREE F1 tier
- ✅ Frontend → Azure Static Web Apps - FREE tier
- ✅ Database → Azure Cosmos DB for MongoDB - Serverless FREE tier

**Total Cost: $0** using GitHub Student Pack ($100 annual credits)

**Quick Start:**
1. Activate [Azure for Students](https://portal.azure.com)
2. Follow [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
3. Deploy in ~1 hour

---

**Project completed as part of ServiceHive Full Stack Internship Assignment**
