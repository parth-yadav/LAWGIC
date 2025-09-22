# GenAI Backend

Node.js backend service with TypeScript, Express, and Prisma.

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations (if needed)
npx prisma migrate dev

# Start development server
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Docker

### Quick Start with Docker Compose

```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build -d
```

### Manual Docker Build

```bash
# Build the image
docker build -t genai-backend .

# Run the container
docker run -p 6900:6900 \
  -e DATABASE_URL="your_database_url" \
  -e JWT_SECRET="your_jwt_secret" \
  genai-backend
```

### Environment Variables

Create a `.env.production` file for production deployment:

```env
NODE_ENV=production
PORT=6900
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Health Check

The application includes a health check endpoint that can be used with Docker:

```bash
curl http://localhost:6900/health
```
