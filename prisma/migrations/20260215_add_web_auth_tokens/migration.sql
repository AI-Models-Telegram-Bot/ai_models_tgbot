-- CreateEnum
CREATE TYPE "WebAuthTokenStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "web_auth_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "WebAuthTokenStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_by_user" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "web_auth_tokens_token_key" ON "web_auth_tokens"("token");

-- CreateIndex
CREATE INDEX "web_auth_tokens_token_idx" ON "web_auth_tokens"("token");

-- AddForeignKey
ALTER TABLE "web_auth_tokens" ADD CONSTRAINT "web_auth_tokens_confirmed_by_user_fkey" FOREIGN KEY ("confirmed_by_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
