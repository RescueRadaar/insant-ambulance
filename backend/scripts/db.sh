#!/bin/bash

case $1 in
  start)
    echo "Starting PostgreSQL database container..."
    docker-compose up -d postgres
    echo "Database started! Connection details:"
    echo "--------------------------------"
    echo "Host: localhost"
    echo "Port: 5432"
    echo "Database: instant_ambulance"
    echo "Username: postgres"
    echo "Password: postgres"
    echo "--------------------------------"
    ;;
  stop)
    echo "Stopping PostgreSQL database container..."
    docker-compose down
    echo "Database stopped!"
    ;;
  status)
    echo "Database container status:"
    docker ps -f "name=instant_ambulance_db"
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac 
