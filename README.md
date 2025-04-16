# React Authentication App

A modern React authentication application with login, signup, and protected routes. Built with TypeScript, React Router, and Tailwind CSS.

## Features

- User authentication (login/signup)
- Protected routes
- JWT token-based authentication
- Refresh token mechanism
- Modern UI with Tailwind CSS
- TypeScript for type safety

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
  ├── components/        # React components
  ├── context/          # Context providers
  ├── services/         # API services
  ├── types/           # TypeScript types
  └── App.tsx          # Main application component
```

## Security Note

This application implements JWT-based authentication with refresh tokens. However, there's a potential security vulnerability in the token refresh mechanism that needs to be reviewed:

- The refresh token is not being updated when a new access token is generated
- This could lead to a refresh token reuse vulnerability if an attacker intercepts the refresh token
- The proper implementation should rotate refresh tokens with each use

## Development Notes

- The application uses React Router v6 for routing
- Authentication state is managed using React Context
- API calls are handled using Axios with interceptors
- Form validation is implemented on both frontend and backend
- Tailwind CSS is used for styling

## API Endpoints

- POST /auth/login - Login endpoint
- POST /auth/signup - Signup endpoint
- POST /auth/refresh - Token refresh endpoint
- POST /auth/logout - Logout endpoint
- GET /user/profile - Get user profile (protected route)

## Contributing

Feel free to submit issues and enhancement requests.
