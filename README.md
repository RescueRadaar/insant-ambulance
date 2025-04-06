# Instant Ambulance

An emergency ambulance service system that connects patients, hospitals, and ambulance drivers in real-time.

## Features

- **User Dashboard:** Request emergency ambulance services with one-click SOS button
- **Hospital Dashboard:** View and accept emergency requests, manage ambulance drivers
- **Driver Management:** Hospitals can register, approve, and assign drivers to emergencies
- **Real-time Emergency Tracking:** Users can track their emergency request status
- **Nearby Hospitals:** Displays hospitals in proximity to the emergency location

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Node.js, Express.js, PostgreSQL
- **Authentication:** JWT-based authentication
- **Containerization:** Docker and Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose (for containerized setup)
- Node.js (v16+) and npm/yarn (for local development)
- PostgreSQL (for local development without Docker)

## Running with Docker (Recommended)

This method requires minimal setup and ensures consistency across different environments.

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/instant-ambulance.git
   cd instant-ambulance
   ```

2. Start the development environment:

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. Access the application:

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - Database: localhost:5433

4. View logs (optional):

   ```bash
   # Frontend logs
   docker logs -f ambulance-frontend-dev

   # Backend logs
   docker logs -f ambulance-backend-dev
   ```

5. Stop the environment:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Rebuilding after code changes:

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

## Running Without Docker (Local Development)

This method is ideal for active development with faster reload times and direct access to all services.

### Setting up the Database

1. Install PostgreSQL on your system
2. Create a new database:
   ```bash
   createdb ambulance
   ```
3. Update the `.env` file in the backend directory with your database credentials

### Starting the Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run database migrations:

   ```bash
   npm run migrate
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. The backend will be available at http://localhost:5000

### Starting the Frontend

1. Open a new terminal and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Update the API_URL in src/lib/api.ts to point to your backend:

   ```typescript
   const api = axios.create({
   	baseURL: "http://localhost:5000/api/v1",
   	// ...
   });
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. The frontend will be available at http://localhost:5173

## Demo Accounts

### User Accounts

- Email: `vibhor.gupta@example.com`
- Password: `Password123!`
- User Type: `user`

### Hospital Account

- Email: `hospital@example.com`
- Password: `Password123!`
- User Type: `hospital`

## Testing the SOS Feature

1. Login using the user account credentials
2. Navigate to the "Emergency Services" page
3. Press the SOS button to create an emergency request with your current location
4. Allow location access when prompted
5. View nearby hospitals in your area

To test the complete flow:

1. Login as a user and create an emergency
2. Login as a hospital to view and accept the emergency
3. Assign a driver to the emergency

## Troubleshooting

### Docker Issues

- If containers fail to start, check logs: `docker logs ambulance-backend-dev`
- To reset the database: `docker-compose -f docker-compose.dev.yml down -v` (warning: this deletes all data)

### Local Development Issues

- Backend connection errors: Check database connection in `.env` file
- Frontend API errors: Ensure the backend URL is correctly set in `api.ts`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Node.js](https://nodejs.org/) for the backend runtime
- [Express.js](https://expressjs.com/) for the API framework
- [PostgreSQL](https://www.postgresql.org/) for the database
