# R4rupee Backend Server

A Node.js backend server using Express.js for the R4rupee application.

## Setup

1. Navigate to the R4rupeeB directory
2. Install dependencies: `npm install`
3. Start the server: `npm start`

The server will run on port 5000 by default, or use the PORT environment variable.

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check

## Development

To run in development mode with auto-restart, install nodemon globally and use `npx nodemon server.js`.

## Troubleshooting

- Ensure Node.js and npm are installed.
- Check if port 5000 is available.
- For production, set the PORT environment variable.