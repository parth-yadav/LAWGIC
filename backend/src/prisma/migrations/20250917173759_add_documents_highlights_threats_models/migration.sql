-- CreateEnum
CREATE TYPE "public"."ThreatSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."highlights" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "position" JSONB NOT NULL,
    "color" JSONB NOT NULL,
    "note" TEXT,
    "tags" TEXT[],
    "author" TEXT DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "threatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."threats" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "threatNumber" INTEGER NOT NULL,
    "severity" "public"."ThreatSeverity" NOT NULL DEFAULT 'HIGH',
    "category" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "position" JSONB,
    "boundingBox" JSONB,
    "wordIndices" INTEGER[],
    "analysisVersion" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "threats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "highlights_threatId_key" ON "public"."highlights"("threatId");

-- CreateIndex
CREATE INDEX "highlights_documentId_pageNumber_idx" ON "public"."highlights"("documentId", "pageNumber");

-- CreateIndex
CREATE INDEX "highlights_userId_documentId_idx" ON "public"."highlights"("userId", "documentId");

-- CreateIndex
CREATE INDEX "threats_documentId_pageNumber_idx" ON "public"."threats"("documentId", "pageNumber");

-- CreateIndex
CREATE INDEX "threats_userId_documentId_idx" ON "public"."threats"("userId", "documentId");

-- CreateIndex
CREATE INDEX "threats_severity_idx" ON "public"."threats"("severity");

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."highlights" ADD CONSTRAINT "highlights_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."highlights" ADD CONSTRAINT "highlights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."highlights" ADD CONSTRAINT "highlights_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "public"."threats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."threats" ADD CONSTRAINT "threats_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."threats" ADD CONSTRAINT "threats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
