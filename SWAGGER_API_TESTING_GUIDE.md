# Swagger API Testing Guide

This guide explains how to test your API endpoints using Swagger UI with JWT authentication.

## 🔧 Swagger Configuration

The Swagger UI has been configured with:
- **Bearer Token Authentication** support
- **API Tags** for better organization
- **JWT Authentication** for protected endpoints

## 🚀 Accessing Swagger UI

1. Start your application:
   ```bash
   npm run start:dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/docs
   ```

## 🔐 Authentication Setup

### Step 1: Login to Get JWT Token

1. In Swagger UI, find the **Authentication** section
2. Click on `POST /auth/login`
3. Click **"Try it out"**
4. Enter your credentials:
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
5. Click **"Execute"**
6. Copy the `accessToken` from the response

### Step 2: Authorize with JWT Token

1. Click the **"Authorize"** button at the top right of Swagger UI
2. In the **JWT-auth** section, enter your token:
   ```
   Bearer your-jwt-token-here
   ```
   (Note: Don't include "Bearer" - Swagger will add it automatically)
3. Click **"Authorize"**
4. Click **"Close"**

## 📝 Testing Protected Endpoints

Once authorized, you can test any protected endpoint:

### User Management
- `GET /users` - Get all users
- `GET /users/company/{id}` - Get users by company
- `POST /users` - Create new user

### Company Management
- `GET /companies/list` - Get all companies
- `GET /companies/{id}` - Get company by ID
- `POST /companies` - Create new company

### Test Management
- `GET /tests/list` - Get all tests
- `GET /tests/{id}` - Get test by ID
- `POST /tests` - Create new test
- `PUT /tests/{id}` - Update test
- `DELETE /tests/{id}` - Delete test

### Battery Management
- `GET /batteries/list` - Get all batteries
- `GET /batteries/{id}` - Get battery by ID
- `POST /batteries` - Create new battery
- `PUT /batteries/{id}` - Update battery
- `DELETE /batteries/{id}` - Delete battery

### Question Management
- `GET /tests/{testId}/questions` - Get questions for a test
- `POST /tests/{testId}/questions` - Create new question
- `PUT /tests/{testId}/questions/{id}` - Update question
- `DELETE /tests/{testId}/questions/{id}` - Delete question

### Option Management
- `GET /questions/{questionId}/options` - Get options for a question
- `POST /questions/{questionId}/options` - Create new option
- `PUT /questions/{questionId}/options/{id}` - Update option
- `DELETE /questions/{questionId}/options/{id}` - Delete option

## 🔄 Public Endpoints (No Authentication Required)

These endpoints don't require authentication:
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout

## 🛠️ Troubleshooting

### Issue: "Authorize" button not visible
**Solution**: Make sure your JWT token is valid and not expired. Try logging in again.

### Issue: Getting 401 Unauthorized
**Solution**: 
1. Check if you're authorized in Swagger
2. Verify your token is not expired
3. Make sure you're testing a protected endpoint

### Issue: Token not working
**Solution**:
1. Log out by clicking "Authorize" → "Logout"
2. Login again to get a fresh token
3. Re-authorize with the new token

## 📋 Testing Workflow

1. **Start Application**: `npm run start:dev`
2. **Open Swagger**: Navigate to `http://localhost:3000/docs`
3. **Login**: Use `POST /auth/login` to get JWT token
4. **Authorize**: Click "Authorize" and enter your token
5. **Test Endpoints**: Try any protected endpoint
6. **Logout**: Use `POST /auth/logout` when done

## 🔍 API Documentation Features

- **Interactive Testing**: Click "Try it out" on any endpoint
- **Request/Response Examples**: See expected data formats
- **Authentication Status**: Green lock icon shows authenticated endpoints
- **Error Responses**: View possible error codes and messages
- **Schema Validation**: Swagger validates your request data

## 💡 Tips

1. **Keep Token Fresh**: JWT tokens expire after 1 hour by default
2. **Use Copy/Paste**: Copy response data for use in other requests
3. **Check Response Codes**: Look at the response code to understand success/failure
4. **Read Documentation**: Each endpoint has detailed descriptions and examples

## 🔒 Security Notes

- Never share your JWT tokens
- Tokens are automatically included in requests after authorization
- Logout when finished testing
- Use HTTPS in production environments

## 📱 Example Test Flow

1. **Register**: `POST /auth/signup` with user details
2. **Login**: `POST /auth/login` with credentials
3. **Get Token**: Copy `accessToken` from response
4. **Authorize**: Enter token in Swagger authorization
5. **Create Company**: `POST /companies` with company details
6. **Create User**: `POST /users` with user details
7. **Test Protected Routes**: Try various GET/POST/PUT/DELETE operations
8. **Logout**: `POST /auth/logout` when finished

This setup provides a complete testing environment for your API with proper JWT authentication integration!
