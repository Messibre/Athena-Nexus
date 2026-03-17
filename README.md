# Athena Nexus

**"Discipline is the motivation"**

A modern web application for managing weekly coding challenges where teams of 3 students can submit their projects with GitHub repositories and live demos. Built with React, Node.js, Express, and MongoDB.

## Tech Stack

- **Frontend**: React 18, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing, rate limiting, helmet

## Features

- **User Roles**: Admin, Group User (team of 3), Public Visitor
- **Weekly Challenges**: Admin can create and manage challenges
- **Submissions**: Teams can submit GitHub repos and live demo links
- **Public Gallery**: View approved submissions
- **Admin Panel**: Manage challenges, groups, and review submissions
- **Security**: JWT authentication, password hashing, rate limiting

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB installed and running (or MongoDB Atlas connection string)

### Installation

1. Install root dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd server
npm install
```

3. Install frontend dependencies:

```bash
cd ../client
npm install
```

4. Create environment file:

```bash
cd ../server
cp .env.example .env
```

5. Generate and set JWT secret:

   ```bash
   cd server
   npm run generate-secret
   ```

   Copy the generated secret to your `.env` file.

6. Edit `server/.env` and set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Paste the generated secret from step 5
   - `PORT` - Backend port (default: 5000)

### Running the Application

**Option 1: Run both servers together (recommended)**

```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):

```bash
cd server
npm run dev
```

Terminal 2 (Frontend):

```bash
cd client
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Creating an Admin User

You'll need to create an admin user manually in MongoDB or through a script. Here's a sample script:

```javascript
const bcrypt = require("bcryptjs");
const User = require("./server/models/User");

const createAdmin = async () => {
  const admin = new User({
    username: "admin",
    password_hash: "Admin12345!",
    role: "admin",
    displayName: "Administrator",
  });
  await admin.save();
  console.log("Admin user created");
};
```

Or use MongoDB Compass/CLI to insert directly.

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Weeks (Public)

- `GET /api/weeks` - Get all weeks
- `GET /api/weeks/active` - Get active week
- `GET /api/weeks/:id` - Get week by ID
- `GET /api/weeks/:id/submissions` - Get submissions for a week

### Submissions

- `GET /api/submissions/public` - Get all approved submissions (public)
- `GET /api/submissions/my-submissions` - Get user's submissions (protected)
- `POST /api/submissions` - Create submission (protected)
- `PUT /api/submissions/:id` - Update submission (protected)

### Admin (Protected, Admin only)

- `POST /api/admin/weeks` - Create week
- `PUT /api/admin/weeks/:id` - Update week
- `DELETE /api/admin/weeks/:id` - Delete week
- `POST /api/admin/users` - Create group/user
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/submissions` - Get all submissions
- `PUT /api/admin/submissions/:id/status` - Approve/reject submission
- `GET /api/admin/submissions/export` - Export CSV
- `GET /api/admin/stats` - Get statistics

## Project Structure

```
sisterhood-challenges-portal/
├── server/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, rate limiting
│   ├── utils/           # Validators, helpers
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context (Auth)
│   │   ├── pages/       # Page components
│   │   └── App.js       # Main app component
│   └── public/          # Static files
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on login (3 attempts per 5 minutes)
- Input validation and sanitization
- CORS protection
- Helmet.js for security headers

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy!

## Environment Variables

### Backend (Server)

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (optional)
- `FRONTEND_URL` or `CLIENT_URL`: Frontend URL for CORS (optional)

### Frontend (Client)

- `REACT_APP_API_URL`: Backend API URL (leave empty for development)

## Creating Admin User

After deployment, create an admin user:

```bash
cd server
MONGODB_URI=your-mongodb-uri node scripts/createAdmin.js
```

Or use MongoDB Atlas UI to insert a user document with:

- `username`: "admin"
- `password_hash`: (bcrypt hash of your password)
- `role`: "admin"
- `displayName`: "Administrator"

## License

ISC

## Notes

This project is maintained without inline comments in source files.
