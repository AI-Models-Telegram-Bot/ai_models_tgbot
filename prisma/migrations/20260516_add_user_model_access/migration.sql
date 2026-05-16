-- CreateTable: per-user model entitlement (unlocks a model regardless of plan tier)
CREATE TABLE "user_model_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "model_slug" TEXT NOT NULL,
    "category" "WalletCategory" NOT NULL,
    "granted_by" TEXT,
    "note" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_model_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_model_access_user_id_model_slug_key" ON "user_model_access"("user_id", "model_slug");

-- CreateIndex
CREATE INDEX "user_model_access_user_id_idx" ON "user_model_access"("user_id");

-- AddForeignKey
ALTER TABLE "user_model_access" ADD CONSTRAINT "user_model_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
