# JWT Token Expiration Debug Guide

This guide will help you test and debug JWT token expiration issues.

## 🔍 Current Issue
- JWT_EXPIRY is set to `15s` in `.env` file
- Token should expire after 15 seconds
- But token is still working after 15 seconds

## 🛠️ Debug Steps

### Step 1: Check Application Logs
When you start the application, you should see these debug logs:
```
JWT_EXPIRY from env: 15s
JWT_EXPIRY final value: 15s
```

### Step 2: Test Token Creation
1. **Login** to get a new token:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "password": "your-password"
     }'
   ```

2. **Check the logs** for:
   ```
   Creating token with expiry: 15s
   Token created at: 2025-01-16T17:02:24.000Z
   ```

### Step 3: Test Token Validation
1. **Use the token** immediately after login:
   ```bash
   curl -X POST http://localhost:3000/auth/test-token \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

2. **Check the logs** for:
   ```
   JWT Strategy validating payload at: 2025-01-16T17:02:24.000Z
   Payload: { sub: 'user-id', email: 'user@example.com', ... }
   ```

### Step 4: Test After Expiration
1. **Wait 16 seconds** after token creation
2. **Try the same request** again:
   ```bash
   curl -X POST http://localhost:3000/auth/test-token \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

3. **Expected result**: Should return `401 Unauthorized`

## 🔧 Using Swagger UI for Testing

### Step 1: Login and Get Token
1. Open `http://localhost:3000/docs`
2. Use `POST /auth/login` to get token
3. Copy the `accessToken` from response

### Step 2: Authorize with Token
1. Click "Authorize" button
2. Enter your token in "JWT-auth" section
3. Click "Authorize" and "Close"

### Step 3: Test Token Endpoint
1. Use `POST /auth/test-token` endpoint
2. Click "Try it out" → "Execute"
3. Note the timestamp in response

### Step 4: Wait and Test Again
1. Wait 16 seconds
2. Try the same endpoint again
3. Should get 401 Unauthorized error

## 🐛 Troubleshooting

### Issue 1: Environment Variable Not Loading
**Symptoms**: Logs show `JWT_EXPIRY from env: undefined`
**Solution**: 
1. Restart the application completely
2. Check `.env` file exists and has `JWT_EXPIRY=15s`
3. Verify no spaces around the `=` sign

### Issue 2: Token Still Works After Expiry
**Possible Causes**:
1. **Clock Skew**: Server time might be off
2. **Token Caching**: Browser/Swagger might be caching
3. **Multiple Tokens**: Using an older token
4. **Strategy Issue**: JWT strategy not checking expiration

### Issue 3: Wrong Expiry Format
**Check**: JWT_EXPIRY format should be:
- `15s` (15 seconds) ✅
- `15` (15 milliseconds) ❌
- `15 seconds` ❌

## 🧪 Manual Token Inspection

You can decode the JWT token to check its expiration:

1. **Copy your token** from login response
2. **Go to**: https://jwt.io
3. **Paste token** in the "Encoded" section
4. **Check the `exp` field** in the payload:
   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "role": "COMPANY_ADMIN",
     "companyId": "company-id",
     "iat": 1737033744,
     "exp": 1737033759
   }
   ```

5. **Convert timestamps**:
   - `iat` = issued at time
   - `exp` = expiration time
   - Difference should be 15 seconds

## 🔄 Complete Test Flow

```bash
# 1. Login and get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 2. Test immediately (should work)
curl -X POST http://localhost:3000/auth/test-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 3. Wait 16 seconds, then test again (should fail)
sleep 16
curl -X POST http://localhost:3000/auth/test-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 📝 Expected Behavior

- **Immediate test**: Returns 200 with user data
- **After 16 seconds**: Returns 401 Unauthorized
- **Logs show**: Token creation time and validation attempts

## 🚨 If Still Not Working

1. **Check server logs** for any errors
2. **Verify JWT strategy** is being used
3. **Test with different expiry times** (e.g., `5s`)
4. **Check if tokens are being cached** somewhere
5. **Verify the JWT library** is working correctly

Let me know what you see in the logs and test results!
