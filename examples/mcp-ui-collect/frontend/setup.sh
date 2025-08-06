#!/bin/bash

echo "🚀 Setting up MCP UI Hello World Application"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Create server directory and install server dependencies
echo "📦 Setting up server example..."
mkdir -p server
cd server

# Create server package.json
cat > package.json << 'EOF'
{
  "name": "mcp-ui-server-example",
  "version": "1.0.0",
  "description": "Example MCP UI server for the hello world app",
  "main": "server-example.js",
  "scripts": {
    "start": "node server-example.js",
    "dev": "nodemon server-example.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "keywords": ["mcp", "ui", "server", "example"],
  "author": "Your Name",
  "license": "MIT"
}
EOF

# Copy server example
cp ../server-example.js .

# Install server dependencies
npm install

if [ $? -eq 0 ]; then
    echo "✅ Server dependencies installed successfully"
else
    echo "❌ Failed to install server dependencies"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the frontend: npm run dev"
echo "2. In another terminal, start the server: cd server && npm start"
echo ""
echo "The application will be available at: http://localhost:3008"
echo "The server will be available at: http://localhost:3009"
echo ""
echo "Happy coding! 🚀" 