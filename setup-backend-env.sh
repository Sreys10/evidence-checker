#!/bin/bash
# Bash script to copy MongoDB credentials from .env.local to backend-service/.env
# Run this script from the root directory: ./setup-backend-env.sh

echo "Setting up backend service environment variables..."

# Read .env.local
if [ -f ".env.local" ]; then
    echo "Reading .env.local..."
    
    # Extract MONGODB_URI and MONGODB_DB_NAME
    MONGODB_URI=$(grep "^MONGODB_URI=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
    MONGODB_DB_NAME=$(grep "^MONGODB_DB_NAME=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
    
    if [ -z "$MONGODB_DB_NAME" ]; then
        MONGODB_DB_NAME="evi-check"
    fi
    
    if [ -n "$MONGODB_URI" ]; then
        # Create backend-service/.env
        BACKEND_ENV_PATH="backend-service/.env"
        cat > "$BACKEND_ENV_PATH" << EOF
# MongoDB Atlas Configuration
# Auto-generated from .env.local
MONGODB_URI=$MONGODB_URI
MONGODB_DB_NAME=$MONGODB_DB_NAME
PORT=5000
BACKEND_SERVICE_URL=http://localhost:5000
EOF
        
        echo "✓ Created $BACKEND_ENV_PATH"
        echo "Backend service is now configured to use MongoDB Atlas!"
    else
        echo "✗ Could not find MONGODB_URI in .env.local"
        echo "Please ensure .env.local contains MONGODB_URI=..."
    fi
else
    echo "✗ .env.local not found in current directory"
    echo "Please run this script from the project root directory"
fi



