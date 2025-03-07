#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Interview Helper Setup ===${NC}"
echo "This script will help you set up the Interview Helper application."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v14 or higher.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo -e "${RED}Node.js version is too old. Please install Node.js v14 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js is installed ($(node -v))${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}Please edit the .env file with your Firebase configuration.${NC}"
fi

# Create server directory if it doesn't exist
mkdir -p server

# Create server .env file if it doesn't exist
if [ ! -f server/.env ]; then
    echo -e "\n${YELLOW}Creating server/.env file...${NC}"
    cp server/.env.example server/.env 2>/dev/null || echo -e "# Server Configuration\nPORT=3000\n\n# OpenAI API Key\nOPENAI_API_KEY=your_openai_api_key\n\n# Firebase Admin Configuration\nFIREBASE_PROJECT_ID=your_project_id\nFIREBASE_CLIENT_EMAIL=your_client_email\nFIREBASE_PRIVATE_KEY=\"your_private_key_with_quotes\"" > server/.env
    echo -e "${GREEN}✓ Created server/.env file${NC}"
    echo -e "${YELLOW}Please edit the server/.env file with your OpenAI API key and Firebase Admin credentials.${NC}"
fi

echo -e "\n${GREEN}Setup completed!${NC}"
echo -e "To run the application:"
echo -e "  - Frontend only: ${YELLOW}npm run dev${NC}"
echo -e "  - Backend only: ${YELLOW}npm run server${NC}"
echo -e "  - Both: ${YELLOW}npm run dev:full${NC}"
echo -e "\nMake sure to update the .env files with your API keys and configuration before running the application." 