-- CreateTable
CREATE TABLE "user_image_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_image_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_image_settings_user_id_key" ON "user_image_settings"("user_id");

-- AddForeignKey
ALTER TABLE "user_image_settings" ADD CONSTRAINT "user_image_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
