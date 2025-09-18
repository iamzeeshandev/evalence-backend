# JWT Authentication Setup with Passport

This document explains the JWT authentication implementation using Passport in the NestJS application.

## Overview

The authentication system has been implemented with the following components:

### 🔧 Swagger Integration
- **Bearer Token Authentication** configured in Swagger UI
- **API Documentation** with proper authentication indicators
- **Interactive Testing** with JWT token support
- Access Swagger UI at: `http://localhost:3000/docs`

### 1. JWT Strategy (`src/modules/auth/strategies/jwt.strategy.ts`)
- Extends `PassportStrategy` with JWT strategy
- Validates JWT tokens from Authorization header
- Returns authenticated user information

### 2. JWT Auth Guard (`src/modules/auth/guards/jwt-auth.guard.ts`)
- Extends `AuthGuard` from Passport
- Handles public routes (marked with `@Public()` decorator)
- Protects all other routes by default
- Returns proper error messages for unauthorized access

### 3. Auth Module (`src/modules/auth/auth.module.ts`)
- Configures JWT module and Passport
- Exports authentication services and guards
- Provides JWT strategy

### 4. Global Guard Setup (`src/app.module.ts`)
- `JwtAuthGuard` is set as a global guard
- All routes are protected by default unless marked as `@Public()`

## Public Routes

The following routes are marked as public and don't require authentication:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `POST /auth/logout` - User logout

## Protected Routes

All other routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Testing the Authentication

### Option 1: Using Swagger UI (Recommended)

1. **Start the Application**:
   ```bash
   npm run start:dev
   ```

2. **Open Swagger UI**:
   Navigate to: `http://localhost:3000/docs`

3. **Login to Get Token**:
   - Use `POST /auth/login` endpoint
   - Click "Try it out" and enter credentials
   - Copy the `accessToken` from response

4. **Authorize in Swagger**:
   - Click the "Authorize" button (🔒) at the top right
   - Enter your JWT token in the "JWT-auth" section
   - Click "Authorize" and "Close"

5. **Test Protected Endpoints**:
   - All endpoints now show a green lock icon
   - You can test any protected route directly in Swagger

### Option 2: Using cURL Commands

### 1. Start the Application
```bash
npm run start:dev
```

### 2. Test Public Endpoints (No Token Required)

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Signup:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Test Company"
  }'
```

### 3. Test Protected Endpoints (Token Required)

**Access Protected Routes:**
```bash
# Get all users (requires authentication)
curl http://localhost:3000/users \
  -H "Authorization: Bearer <your-jwt-token>"

# Get all companies (requires authentication)
curl http://localhost:3000/companies/list \
  -H "Authorization: Bearer <your-jwt-token>"

# Get all tests (requires authentication)
curl http://localhost:3000/tests/list \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 4. Test Unauthorized Access

**Access Protected Route Without Token:**
```bash
curl http://localhost:3000/users
# Should return 401 Unauthorized
```

**Access Protected Route With Invalid Token:**
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer invalid-token"
# Should return 401 Unauthorized
```

## Using the CurrentUser Decorator

In your controllers, you can access the authenticated user using the `@CurrentUser()` decorator:

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './decorators/auth.decorator';
import { AuthenticatedUser } from './interfaces/auth.interface';

@Controller('example')
export class ExampleController {
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };
  }
}
```

## Environment Variables

Make sure you have the following environment variables set:

```env
JWT_TOKEN_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
```

## Security Notes

1. **JWT Secret**: Use a strong, random secret key in production
2. **Token Expiration**: Configure appropriate expiration times
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: Store tokens securely on the client side
5. **Logout**: Implement proper token invalidation if needed

## Troubleshooting

1. **401 Unauthorized**: Check if the token is valid and not expired
2. **Token Format**: Ensure the Authorization header format is `Bearer <token>`
3. **Public Routes**: Verify routes are marked with `@Public()` decorator
4. **Module Imports**: Ensure AuthModule is imported in AppModule

## File Structure

```
src/modules/auth/
├── decorators/
│   └── auth.decorator.ts          # @Public() and @CurrentUser() decorators
├── guards/
│   └── jwt-auth.guard.ts          # JWT authentication guard
├── interfaces/
│   └── auth.interface.ts          # AuthenticatedUser interface
├── strategies/
│   └── jwt.strategy.ts            # JWT Passport strategy
├── auth.controller.ts             # Login, signup, logout endpoints
├── auth.module.ts                 # Auth module configuration
└── auth.service.ts                # Authentication business logic
```
