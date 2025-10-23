# Authentication System Documentation

## Overview
This application now includes a fully functional authentication system with user registration, login, and session management using NextAuth.js and Prisma ORM with SQLite database.

## Features

### ✨ Authentication Features
- **User Registration**: Create new accounts with email and password
- **User Login**: Secure authentication with credentials
- **Session Management**: JWT-based session handling
- **Protected Routes**: Session-aware components
- **User Profile**: Display logged-in user information
- **Sign Out**: Secure logout functionality

## Technology Stack

- **NextAuth.js**: Authentication framework for Next.js
- **Prisma**: Modern ORM for database management
- **SQLite**: Local database (easily switchable to PostgreSQL/MySQL)
- **bcryptjs**: Password hashing
- **JWT**: JSON Web Tokens for session management

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your application URL

### 2. Database Setup

Run Prisma migrations to set up the database:

```bash
npm run prisma migrate dev
```

Generate Prisma Client:

```bash
npm run prisma generate
```

### 3. Start the Application

```bash
npm run dev
```

## Usage

### Sign Up
1. Navigate to `/signup`
2. Enter your name (optional), email, and password
3. Click "Create Account"
4. You'll be redirected to the login page

### Login
1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the home page with an active session

### User Menu
- Click on the user icon in the top-right corner
- View your profile information
- Sign out when needed

## API Routes

### Authentication Routes

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/signin`
NextAuth.js handles sign-in via credentials provider.

#### GET/POST `/api/auth/[...nextauth]`
NextAuth.js dynamic route for all authentication operations.

## Security Features

### Password Security
- Passwords are hashed using bcryptjs with a cost factor of 10
- Plain-text passwords are never stored in the database
- Passwords must be at least 6 characters long

### Session Security
- JWT-based sessions with secure tokens
- Session tokens are httpOnly cookies
- Configurable session expiration
- CSRF protection enabled

### Database Security
- Prepared statements via Prisma (SQL injection protection)
- Email uniqueness constraint
- Cascading deletes for related data

## Database Migration

### Switch to PostgreSQL (Recommended for Production)

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ytmusic"
```

3. Run migrations:
```bash
npx prisma migrate dev
```

## Testing

### Test User Creation
1. Go to `/signup`
2. Create a test account
3. Verify you can log in
4. Check that the user menu shows your information

### Test Session Persistence
1. Log in
2. Refresh the page
3. Verify you're still logged in
4. Close and reopen the browser
5. Verify session persistence

## Troubleshooting

### Common Issues

#### "Invalid credentials" error
- Verify email and password are correct
- Check database connection
- Ensure user exists in the database

#### Session not persisting
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your application URL
- Clear browser cookies and try again

#### Database connection errors
- Verify DATABASE_URL is correct
- Check database file permissions (SQLite)
- Ensure Prisma Client is generated

### Debug Mode

Enable NextAuth.js debug mode in `src/lib/auth.ts`:
```typescript
export const authOptions: NextAuthOptions = {
  // ... other options
  debug: process.env.NODE_ENV === 'development',
}
```

## Future Enhancements

Potential improvements:
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Social authentication (Google, GitHub, etc.)
- [ ] Two-factor authentication (2FA)
- [ ] Role-based access control
- [ ] User profile editing
- [ ] Account deletion
- [ ] OAuth providers integration

## File Structure

```
/workspace/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/
│   │   │       │   └── route.ts    # NextAuth API routes
│   │   │       └── signup/
│   │   │           └── route.ts    # Signup API route
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   └── signup/
│   │       └── page.tsx            # Signup page
│   ├── components/
│   │   ├── SessionProvider.tsx     # Session context provider
│   │   └── UserMenu.tsx           # User menu component
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration
│   │   └── prisma.ts              # Prisma client singleton
│   └── types/
│       └── next-auth.d.ts         # NextAuth type extensions
├── .env                           # Environment variables
└── .env.example                   # Environment template
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review NextAuth.js documentation: https://next-auth.js.org/
3. Review Prisma documentation: https://www.prisma.io/docs/

---

**Note**: This authentication system is production-ready but should be reviewed and customized based on your specific security requirements.
