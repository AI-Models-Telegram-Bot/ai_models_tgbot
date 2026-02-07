-- CreateTable
CREATE TABLE "user_audio_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "elevenlabs_settings" JSONB,
    "suno_settings" JSONB,
    "sound_gen_settings" JSONB,
    "voice_cloning_settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_audio_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_audio_settings_user_id_key" ON "user_audio_settings"("user_id");

-- AddForeignKey
ALTER TABLE "user_audio_settings" ADD CONSTRAINT "user_audio_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
