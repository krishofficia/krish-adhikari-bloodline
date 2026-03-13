# Bloodline - Blood Donation Platform

A full-stack web application for connecting blood donors with organizations in need.

## Features

- **Donor Registration & Login**: Secure registration and authentication for blood donors
- **Organization Login**: Organizations can login to request blood
- **Donor Dashboard**: View profile, manage availability, see matching blood requests
- **Organization Dashboard**: Request blood, view available donors
- **Real Backend**: Node.js/Express server 
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome Icons

### Backend
- Node.js
- Express.js
- SQLite3
- JWT (JSON Web Tokens)
- Bcryptjs

## Installation

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open the application**
   - The server will run on `http://localhost:3000`
   - Open your browser and navigate to `http://localhost:3000`

## Default Accounts

### Donors
- Email: `donor@example.com` | Password: `password123`
- Email: `jane@example.com` | Password: `password123`
- Email: `mike@example.com` | Password: `password123`
- Email: `sarah@example.com` | Password: `password123`

### Organization
- Email: `org@example.com` | Password: `password123`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new donor
- `POST /api/login` - Login (donor or organization)
- `GET /api/profile` - Get current user profile (protected)

### Donor
- `GET /api/donor/notifications` - Get blood requests matching donor's blood group (protected)
- `PUT /api/donor/availability` - Update availability status (protected)

### Organization
- `POST /api/blood-request` - Create a blood request (protected)
- `GET /api/donors` - Get all available donors (protected)

## Project Structure

```
Bloodline Web App/
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration page
├── donor-dashboard.html    # Donor dashboard
├── org-dashboard.html      # Organization dashboard
├── style.css               # Stylesheet
├── script.js               # Frontend JavaScript
├── server.js               # Backend server
├── package.json            # Dependencies
└── bloodline.db           # SQLite database (created automatically)
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- API endpoints are protected with authentication middleware
- CORS is enabled for cross-origin requests

## Development

The database is automatically initialized with mock data on first run. The SQLite database file (`bloodline.db`) will be created in the project root.

## License

ISC

