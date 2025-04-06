-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('user', 'hospital', 'driver', 'admin');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  date_of_birth DATE,
  emergency_contact VARCHAR(20),
  profile_picture VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  hospital_type VARCHAR(100) NOT NULL,
  specialty VARCHAR(255),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  emergency_capacity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hospital_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  vehicle_registration VARCHAR(100) UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Emergency request status enum
CREATE TYPE emergency_status AS ENUM (
  'pending',
  'accepted',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);

-- Emergency requests table
CREATE TABLE IF NOT EXISTS emergency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  emergency_type VARCHAR(100) NOT NULL,
  description TEXT,
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  status emergency_status NOT NULL DEFAULT 'pending',
  hospital_id UUID REFERENCES hospitals(id),
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_emergency_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_emergency_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- Emergency assignments table
CREATE TABLE IF NOT EXISTS emergency_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id UUID NOT NULL REFERENCES emergency_requests(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  pickup_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status emergency_status NOT NULL DEFAULT 'assigned',
  notes TEXT,
  CONSTRAINT fk_assignment_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_requests(id),
  CONSTRAINT fk_assignment_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id UUID NOT NULL REFERENCES emergency_requests(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  CONSTRAINT fk_chat_emergency FOREIGN KEY (emergency_id) REFERENCES emergency_requests(id),
  CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_emergency_requests_user_id ON emergency_requests(user_id);
CREATE INDEX idx_emergency_requests_hospital_id ON emergency_requests(hospital_id);
CREATE INDEX idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX idx_emergency_assignments_emergency_id ON emergency_assignments(emergency_id);
CREATE INDEX idx_emergency_assignments_driver_id ON emergency_assignments(driver_id);
CREATE INDEX idx_chat_messages_emergency_id ON chat_messages(emergency_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id); 
