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

- Docker and Docker Compose
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/instant-ambulance.git
   cd instant-ambulance
   ```

2. Set up environment variables:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Start the application using Docker:

   ```bash
   docker-compose up -d
   ```

4. The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## Usage

### User

1. Register an account or use a demo account:

   - Email: `vibhor.gupta@example.com`
   - Password: `Password123!`

2. Login to access the dashboard and emergency services.

3. Press the SOS button to create an emergency request with your current location.

4. View nearby hospitals and track your emergency request status.

### Hospital

1. Login with a hospital account:

   - Email: `hospital@example.com`
   - Password: `Password123!`

2. View incoming emergency requests in the "Cases" page.

3. Accept emergency requests and assign available drivers.

4. Manage drivers (approve new driver registrations, view status).

### Driver

1. Login with a driver account (once approved by a hospital).

2. View assigned emergencies and update status (arrived, completed).

## Development

### Running Locally (without Docker)

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Node.js](https://nodejs.org/) for the backend runtime
- [Express.js](https://expressjs.com/) for the API framework
- [PostgreSQL](https://www.postgresql.org/) for the database
