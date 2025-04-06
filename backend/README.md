# Instant Ambulance Connection System

A real-time emergency ambulance connection system that connects users, hospitals, and drivers to efficiently manage emergency medical services.

## Features

- User, hospital, and driver registration and authentication
- Emergency request creation and management
- Hospital dashboard to accept emergency requests
- Driver assignment and tracking
- Real-time communication between users, hospitals, and drivers

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.IO
- **Testing**: Jest
- **Linting**: ESLint, Prettier

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd instant_ambulance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env` with your own configuration.

### 4. Start the PostgreSQL database

We use Docker to provide a PostgreSQL database for local development:

```bash
# Start the database
npm run db:start

# Check database status
npm run db:status

# Stop the database (when you're done)
npm run db:stop
```

#### Database connection details (for PgAdmin):

- **Host:** localhost
- **Port:** 5432
- **Database:** instant_ambulance
- **Username:** postgres
- **Password:** postgres

### 5. Run database migrations

```bash
npm run migrate
```

### 6. Start the development server

```bash
# Development with ts-node (no separate build step)
npm run dev

# OR: Development with TypeScript watch + nodemon
npm run dev:build
```

The server will be running at http://localhost:3000.

## Project Structure

```
instant_ambulance/
│
├── src/                      # Source code
│   ├── config/               # Configuration files and environment variable handling
│   ├── controllers/          # Route controllers
│   ├── database/             # Database connection and migrations
│   ├── middleware/           # Express middleware
│   ├── models/               # Database models
│   ├── routes/               # Express routes
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   └── index.ts              # Application entry point
│
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
│
├── dist/                     # Compiled JavaScript files (build output)
├── logs/                     # Application logs
├── .env.example              # Example environment variables
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── jest.config.js            # Jest configuration
├── package.json              # Project dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run build`: Build the project for production
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run lint`: Lint the code
- `npm run lint:fix`: Fix linting issues
- `npm run format`: Format code using Prettier

## Database Schema

The system uses the following core tables:

- `users`: Store user information
- `hospitals`: Store hospital information
- `drivers`: Store driver information
- `emergency_requests`: Store emergency request details
- `emergency_assignments`: Store assignment of drivers to emergency requests
- `chat_messages`: Store messages exchanged during emergencies

## API Endpoints

The API documentation will be available at `/api/docs` after starting the server.

## License

This project is licensed under the MIT License.
