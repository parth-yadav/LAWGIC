# AI Coding Agent Instructions for GenAI Project

## Project Overview
Full-stack legal document AI application with PDF viewer and AI-powered text explanation. Next.js 15 (App Router) frontend + Express.js backend + Prisma ORM + PostgreSQL database.

## Core Architecture

### Frontend (Next.js App Router)
- **Route Groups**: `(auth)` for authentication pages, `(main)` for app content with nested `(public)`/`(secure)` routes
- **PDF Viewer**: Custom PDF.js integration at `/documents/[documentId]` with text selection → AI explanation workflow
- **Components**: shadcn/ui (New York style) + Radix primitives + custom PDF viewer components
- **State**: React Context providers (`SessionProvider`, `DataProvider`, `ThemeProvider`) + local useState for PDF features

### Backend (Express + TypeScript)
- **Structure**: `controllers/` → `routes/` → `middlewares/` pattern
- **Authentication**: JWT access tokens + refresh tokens in HTTP-only cookies, Google OAuth integration
- **AI Integration**: Google Gemini API for legal text explanation with structured JSON response schema

### Database (Prisma + PostgreSQL)
- **Schema Location**: `backend/src/prisma/schema.prisma` (custom config in `prisma.config.ts`)
- **Models**: User, RefreshToken, OTP with CUID IDs

## Development Workflow

### Commands
```bash
# Backend development
cd backend && npm run dev    # tsx watch src/server.ts
cd backend && npm run build  # TypeScript compilation
cd backend && npm run lint   # tsc --noEmit validation

# Frontend development  
cd frontend && npm run dev   # Next.js dev server
cd frontend && npm run build # Next.js production build
```

### Path Mapping
- Backend: `@/*` → `./src/*`
- Frontend: `@/*` → `./*` (root level)

## Critical Patterns

### API Response Structure
All backend responses use `sendResponse()` from `utils/ResponseHelpers.ts`:
```typescript
{
  success: boolean,
  message?: string,
  data?: any,
  error?: { message: string, details?: any }
}
```

### Authentication Flow
1. **Middleware**: `middleware.ts` handles automatic token refresh on all routes
2. **API Interceptor**: `utils/ApiClient.ts` provides axios instance with retry logic for 401s
3. **Protected Routes**: Use `validToken` middleware in backend, conditional rendering in frontend

### PDF Text Explanation Workflow
1. User selects text in PDF viewer (`pdf/PdfViewer.tsx`)
2. Context extraction via `pdf/explain/extractContext.ts` (current + adjacent pages)
3. API call to `/explain/text` with selection + context
4. Gemini API processes with legal expert prompt → structured JSON response

### Component Organization
- **UI Components**: `components/ui/` (shadcn/ui generated)
- **Feature Components**: `components/[feature]/` (auth, landing, profile, etc.)
- **PDF Components**: `pdf/` (self-contained PDF viewer system)
- **Layouts**: App Router layouts with route groups for different app sections

## Key Files for Context

### Backend Entry Points
- `src/server.ts` - Express app setup and route mounting
- `src/routes/auth.routes.ts` - Authentication endpoints
- `src/controllers/explain.controllers.ts` - AI text explanation logic

### Frontend Entry Points  
- `app/layout.tsx` - Root layout with providers
- `app/(main)/layout.tsx` - Main app layout with navigation
- `pdf/index.tsx` - PDF viewer component entry point
- `middleware.ts` - Request interception for auth

### Configuration
- `backend/prisma.config.ts` - Custom Prisma schema location
- `frontend/components.json` - shadcn/ui configuration
- `frontend/next.config.ts` - Image domains for Google avatars + S3

## Environment Variables
Backend requires: `DATABASE_URL`, `COMPLEX_WORDS_API_KEY` (Gemini), Google OAuth credentials
Frontend requires: `NEXT_PUBLIC_SERVER_BASE_URL`

## Development Tips
- Use `tsx watch` for backend hot reload (not nodemon)
- Prisma schema is in non-standard location - check `prisma.config.ts`
- PDF.js version conflicts are common - check `next.config.ts` for worker config if needed
- Authentication state flows through multiple layers - check middleware, API client, and session provider together
- PDF text selection uses DOM Range API with custom positioning for context menus