import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import passport from 'passport';

import config from './config';
import { logger, morganStream } from './utils/logger';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import emergencyRoutes from './routes/emergency.routes';
import hospitalRoutes from './routes/hospital.routes';
import driverRoutes from './routes/driver.routes';

// Initialize Express app
const app: Express = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins temporarily for debugging
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
// app.use(helmet()); // Temporarily disabled for CORS debugging
app.use(
  cors({
    origin: '*', // Allow all origins temporarily for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }),
);
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body
app.use(morgan('combined', { stream: morganStream })); // HTTP request logging
app.use(passport.initialize()); // Initialize passport

// API routes
const apiRouter = express.Router();
app.use(config.server.apiPrefix, apiRouter);

// Register routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/', emergencyRoutes); // Mount emergency routes directly at root
apiRouter.use('/', hospitalRoutes); // Mount hospital routes directly at root
apiRouter.use('/driver', driverRoutes); // Mount driver routes at /driver

// API welcome route
apiRouter.get('/', (req, res) => {
  res.json({ message: 'Instant Ambulance API is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.env} mode`);
  logger.info(`API available at http://localhost:${PORT}${config.server.apiPrefix}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection', { error: err.stack });
  // In production, we might want to gracefully shutdown
  // server.close(() => process.exit(1));
});

export { app, server, io };
