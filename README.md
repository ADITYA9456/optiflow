
# OptiFlow - Workflow Optimization Tool

A full-stack workflow optimization tool built with Next.js, Tailwind CSS, Node.js, Express, and MongoDB.

## Features

### 🏠 Landing Page
- Professional landing page with company branding
- Feature highlights and pricing information
- Simple navigation with authentication options
- Responsive design with Tailwind CSS

### 🔐 Authentication System
- User signup and login with JWT tokens
- Secure password hashing with bcryptjs
- Protected routes and session management
- Automatic token validation

### 📊 Dashboard
- Modern, responsive dashboard interface
- Task management with CRUD operations
- Real-time task statistics and analytics
- Tabbed interface for organized content

### ✅ Task Management
- Create tasks with title, description, deadline, and priority
- Track task status (pending, in-progress, completed)
- Visual task cards with priority and status indicators
- Deadline tracking with overdue notifications

### 🤖 AI-Powered Workflow Optimization
- Intelligent workflow suggestions based on task patterns
- Priority recommendations for better productivity
- Time management insights and alerts
- Mock AI service with realistic suggestions

### 📈 Analytics Dashboard
- Task distribution visualization
- Productivity insights and completion rates
- Progress tracking with interactive charts
- Performance metrics and trends

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes, Express-like routing
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS for responsive design
- **Charts**: Chart.js and React-Chart.js-2 for analytics

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm package manager

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/optiflow
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
AI_API_KEY=mock-ai-api-key
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use the default connection string: `mongodb://localhost:27017/optiflow`

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace the `MONGODB_URI` in `.env.local`

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage Guide

### 1. Getting Started
1. Visit `http://localhost:3000`
2. Click "Sign Up" to create a new account
3. Fill in your details and create your account
4. You'll be redirected to the dashboard

### 2. Managing Tasks
1. In the dashboard, click "Add Task"
2. Fill in task details (title, description, deadline, priority)
3. Click "Add Task" to save

### 3. Task Operations
- **Update Status**: Use the dropdown on each task card
- **Edit Task**: Click the edit icon on any task
- **Delete Task**: Click the delete icon (requires confirmation)

### 4. AI Suggestions
1. Navigate to the "AI Suggestions" tab
2. View workflow optimization recommendations
3. Mark suggestions as implemented when you apply them

### 5. Analytics
1. Go to the "Analytics" tab
2. View task distribution and productivity insights
3. Monitor completion rates and overdue tasks

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### Suggestions
- `GET /api/suggestions` - Get AI suggestions
- `PUT /api/suggestions` - Mark suggestion as implemented

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard page
│   ├── login/        # Login page
│   ├── signup/       # Signup page
│   └── page.js       # Landing page
├── components/       # Reusable components
├── lib/             # Database connection
├── models/          # MongoDB models
└── utils/           # Utility functions
```

## Production Deployment

### Environment Variables for Production
```env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=strong-random-secret-for-production
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### Build and Deploy
```bash
npm run build
npm start
```

## Support

For support and questions:
- Email: contact@optiflow.com
- Phone: +1 (555) 123-4567

---

**OptiFlow** - Optimize your workflow, maximize your productivity! 🚀

