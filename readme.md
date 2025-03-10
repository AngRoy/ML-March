# ML March Website

A comprehensive website for the ML March event at IIEST Shibpur, featuring user authentication, profile management, session tracking, and resources for machine learning enthusiasts.

## Features

- **User Authentication**: Secure Google-based authentication
- **User Profiles**: Encrypted storage of user profile information
- **Dashboard**: Personalized dashboard for enrolled participants
- **Session Management**: Track upcoming and completed sessions
- **Resource Library**: Machine learning resources and materials
- **Responsive Design**: Works on all devices from mobile to desktop

## Technology Stack

- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6+)
  - Modular JavaScript architecture
  - Responsive design with custom CSS

- **Backend**:
  - Node.js with Express
  - SQLite database for data persistence
  - Firebase Authentication for user login

- **Security**:
  - Encryption for sensitive data (AES-256-CBC)
  - CSRF protection
  - Input validation and sanitization
  - Secure password hashing with bcrypt

## Project Structure

```
ml-march/
├── index.html              # Main HTML file
├── package.json            # Node.js dependencies
├── .env                    # Environment variables (created during setup)
├── css/                    # CSS styles
│   ├── style.css           # Main CSS styles
│   ├── dashboard.css       # Dashboard-specific styles
│   └── responsive.css      # Responsive design styles
├── js/                     # Client-side JavaScript
│   ├── main.js             # Core application initialization
│   ├── auth.js             # Authentication functions
│   ├── firebase-config.js  # Firebase configuration
│   ├── ui.js               # UI update functions
│   ├── events.js           # Event handlers
│   └── animations.js       # Animations and visual effects
├── server/                 # Server-side code
│   ├── server.js           # Express server
│   └── database/           # Database setup and migrations
│       ├── setup.js        # Database initialization
│       └── mlmarch.db      # SQLite database (created during setup)
└── assets/
    └── images/             # Image directory
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ml-march.git
   cd ml-march
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Initialize the database:
   ```
   npm run setup-db
   ```

4. Create a Firebase project and update the configuration in `js/firebase-config.js`

5. Start the server:
   ```
   npm start
   ```

6. Visit `http://localhost:3000` in your browser

## Security Implementation

The application implements several security measures:

1. **Data Encryption**: Sensitive user data (like phone numbers) are encrypted using AES-256-CBC encryption before being stored in the database. Each user's data is encrypted with a unique salt for added security.

2. **Hashing**: Firebase handles password hashing for authentication, while the server encrypts sensitive profile information.

3. **Environmental Security**: Encryption keys are stored in environment variables, not in the code.

4. **Input Validation**: All user inputs are validated both on the client and server side before processing.

5. **CSRF Protection**: Implemented through proper token validation for state-changing operations.

6. **Content Security**: Strict content security policies to prevent XSS attacks.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Authors

- IIEST Shibpur Coding Team

## Acknowledgments

- Google Developer Students Club (GDSC) @IIEST
- CodeIIEST - The Official Coding Club of IIEST Shibpur