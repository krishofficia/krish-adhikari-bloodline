# Bloodline Web App - Organized Structure

## 📁 Project Structure

```
Bloodline Web App/
├── frontend/           # Frontend files (HTML, CSS, JS)
│   ├── *.html          # All HTML pages
│   ├── *.css           # Stylesheets
│   └── *.js            # JavaScript files
│
├── backend/            # Backend files (Node.js, MongoDB)
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── package.json      # Backend dependencies
│   └── server.js        # Main server file
│
├── .env               # Environment variables
├── .gitignore         # Git ignore file
└── README.md          # This file
```

## 🚀 How to Start

### Option 1: Using Batch File (Windows)
```bash
start-organized.bat
```

### Option 2: Using PowerShell (Windows)
```powershell
./start-organized.ps1
```

### Option 3: Manual Start
```bash
cd backend
set EMAIL_USER=your-gmail@gmail.com
set EMAIL_PASS=your-16-character-app-password
set MONGODB_URI=mongodb://127.0.0.1:27017/bloodline
node server.js
```

## 📋 Environment Variables

Create a `.env` file in the root directory:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
MONGODB_URI=mongodb://127.0.0.1:27017/bloodline
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Admin Panel**: http://localhost:3000/admin-login.html

## 📦 Dependencies

### Backend Dependencies
- Express.js (Web framework)
- MongoDB (Database)
- Mongoose (MongoDB ODM)
- JWT (Authentication)
- Bcrypt.js (Password hashing)
- Nodemailer (Email notifications)
- Natural (NLP for chatbot)

### Frontend Technologies
- HTML5
- CSS3
- JavaScript (ES6+)
- Font Awesome (Icons)
- Responsive Design

## 🔧 Development

### Install Dependencies
```bash
cd backend
npm install
```

### Start Development Server
```bash
cd backend
npm run dev
```

## 📁 File Organization

### Frontend Folder Contains:
- All HTML pages (index.html, login.html, admin-dashboard.html, etc.)
- CSS files (style.css)
- JavaScript files (script.js, admin-dashboard.js, etc.)

### Backend Folder Contains:
- Server configuration
- Database models (User, Organization, Donor, etc.)
- API routes (auth, bloodRequests, admin)
- Package management files

## 🩸 Features

- User authentication (donors & organizations)
- Admin panel with organization verification
- Blood request management
- AI-powered chatbot
- Email notifications
- PAN card verification
- Responsive design

## 🔄 Migration Notes

This organized structure separates frontend and backend concerns:
- Frontend files are served statically from `/frontend`
- Backend API runs from `/backend/server.js`
- Environment variables are loaded from root `.env`
- All existing functionality is preserved
