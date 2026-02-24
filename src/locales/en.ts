export const en = {
  // Buttons - Main Menu
  buttons: {
    textAi: '🤖 Text AI',
    imageAi: '🖼 Image AI',
    videoAi: '🎬 Video AI',
    audioAi: '🎵 Audio AI',
    profile: '👤 Profile',
    help: '❓ Help',
    back: '⬅️ Back',
    cancel: '❌ Cancel',
    mainMenu: '🏠 Main menu',
    // Help Menu
    support: '🆘 Support',
    community: '👥 Community',
    language: '🌐 Language',
    instructions: '📋 Instructions',
    privacy: '🔒 Privacy',
    // Profile
    topUp: '💳 Top Up',
    referrals: '👥 Referrals',
    history: '📜 History',
    // Language
    langEnglish: '🇺🇸 English',
    langRussian: '🇷🇺 Русский',
    // Audio Functions
    audioElevenLabs: '🎙️ ElevenLabs Voice',
    audioVoiceCloning: '👥 Voice Cloning',
    audioSuno: '🎸 SUNO (Music)',
    audioSoundGen: '🥁 Sound Generator',
    audioVoiceSettings: '🎛️ Voice Settings',
    audioSunoSettings: '🎛️ SUNO Settings',
    audioSoundSettings: '🎛️ Sound Settings',
    // Image Families
    imageFluxFamily: '🔥 Flux Family',
    imageDalleFamily: '✨ DALL-E',
    imageMidjourneyFamily: '🎨 Midjourney',
    imageNanoBananaFamily: '🍌 Nano Banana (⚡6)',
    imageNanoBananaProFamily: '🍌 Nano Banana Pro (⚡20)',
    imageSeedreamFamily: '🌱 Seedream',
    // Image Models
    imageFluxSchnell: '⚡ Flux Schnell (⚡2)',
    imageFluxKontext: '🎨 Flux Kontext (⚡5)',
    imageFluxDev: '🔧 Flux Dev (⚡12)',
    imageFluxPro: '💎 Flux Pro (⚡20)',
    imageDallE2: '🎨 DALL-E 2 (⚡10)',
    imageDallE3: '✨ DALL-E 3 (⚡25)',
    imageNanoBanana: '🍌 Nano Banana (⚡6)',
    imageNanoBananaPro: '🍌 Nano Banana Pro (⚡20)',
    imageSeedream: '🌱 Seedream 4.0 (⚡5)',
    imageSeedream45: '🌱 Seedream 4.5 β (⚡8-15)',
    imageSettings: '🎛️ Image Settings',
    // Video Families
    videoKlingFamily: '🎥 Kling',
    videoVeoFamily: '🌐 Google Veo',
    videoSoraFamily: '🎬 Sora',
    videoRunwayFamily: '✈️ Runway',
    videoLumaFamily: '💫 Luma',
    videoWanFamily: '🌊 WAN',
    videoSeedanceFamily: '🌱 Seedance',
    // Video Models
    videoKling: '🎥 Kling Standard (⚡12–32)',
    videoKlingPro: '💎 Kling Pro (⚡20–116)',
    videoVeoFast: '⚡ Veo Fast (⚡9–20)',
    videoVeoQuality: '💎 Veo Quality (⚡34–80)',
    videoSora: '🎬 Sora 2 (⚡9–57)',
    videoSoraPro: '💎 Sora 2 Pro (⚡40–150)',
    videoRunwayGen4: '✈️ Runway Gen-4 (⚡20–60)',
    videoRunwayTurbo: '⚡ Runway Gen-4 Turbo (⚡15–45)',
    videoSeedanceLite: '🌱 1.0 Lite (⚡8–24)',
    videoSeedancePro: '💎 1.0 Pro (⚡30–90)',
    videoSeedanceFast: '⚡ 1.0 Fast (⚡12–36)',
    videoSeedance15Pro: '🌱 1.5 Pro (⚡15–45)',
    videoSettings: '🎛️ Video Settings',
    // Chat
    chatNewChat: '➕ New Chat',
    chatMyChats: '📋 My Chats',
  },

  // Messages
  messages: {
    // Welcome & Start
    welcome: `Welcome to AI Models Bot! 🤖

Choose a category to start:
• 🤖 Text AI - Chat with GPT-4, Claude, Grok
• 🖼 Image AI - Generate images with DALL-E, Flux
• 🎬 Video AI - Create videos with Kling, Luma
• 🎵 Audio AI - Generate speech and music

Use the menu below to navigate.`,

    // Web Auth
    webAuthSuccess: '✅ You have successfully logged in to the web version of VseoNix. Please return to the website to continue.',

    // Main Menu
    chooseOption: 'Choose an option:',
    chooseCategoryOrAction: 'Choose a category or action:',

    // Profile
    profile: `👤 <b>Your Profile</b>

<b>Username:</b> @{username}

💰 <b>Balance</b>
⚡ {tokenBalance} tokens

<b>Total spent:</b> ${'{totalSpent}'} USD

🔗 <b>Referral Program</b>
Your code: <code>{referralCode}</code>
Referrals: {referralCount}
Tokens earned: {referralBonus} ⚡

Share your link:
<code>https://t.me/{botUsername}?start={referralCode}</code>`,

    // Help
    help: `❓ <b>Help</b>

Press the corresponding button to contact support, ensure the safety of your data, read information about adding the chatbot to groups, or get usage instructions 👇`,

    instructions: `📋 <b>Instructions</b>

<b>How to Use:</b>
1️⃣ Choose a category (Text, Image, Video, Audio)
2️⃣ Select a model
3️⃣ Send your prompt
4️⃣ Wait for the result

<b>Token Costs:</b>
• Text: 1 token
• Image: 1-2 tokens
• Audio: 1-3 tokens
• Video: 5 tokens

<b>Get Free Credits:</b>
• Refer friends and earn bonus credits
• Use promo codes`,

    support: `🆘 <b>Support</b>

If you have any questions or issues, contact us:
📧 Email: support@example.com
💬 Telegram: @support`,

    community: `👥 <b>Community</b>

Join our community:
📢 Channel: @aichannel
💬 Chat: @aichat`,

    privacy: `🔒 <b>Privacy</b>

Your data is secure. We don't store your conversations permanently.
Read our full privacy policy: example.com/privacy`,

    // Language
    selectLanguage: '🌐 <b>Select Language</b>\n\nChoose your preferred language:',
    languageChanged: '✅ Language changed to English',

    // Categories
    categoryText: `🤖 <b>TEXT Models</b>

Chat with advanced language models like GPT-4o, Claude, and Grok.

Select a model:`,

    categoryImage: `🖼 <b>IMAGE Models</b>

Generate stunning images with DALL-E 3 and Flux.

Select a model:`,

    categoryVideo: `🎬 <b>VIDEO Models</b>

Create videos with Kling and Luma Dream Machine.

Select a model:`,

    categoryAudio: `🎵 <b>AUDIO Models</b>

Generate speech with ElevenLabs or music with Suno.

Select a model:`,

    // Audio Functions
    audioFunctionSelect: `🎵 <b>Audio AI</b>

Choose an audio function:`,

    audioElevenLabsDesc: `🎙️ <b>ElevenLabs Voice</b>

Premium text-to-speech synthesis with hundreds of natural voices in 29 languages.

💡 Select your preferred voice in Voice Settings, then send any text to convert to speech.

Fee: ⚡15 credits per generation`,

    audioVoiceCloningDesc: `👥 <b>Voice Cloning</b>

Clone any voice from an audio sample and use it for speech synthesis.

📎 Send a voice message or audio file (5 sec – 5 min) to set the reference voice
✍️ Then send text to generate speech with the cloned voice

Fee: ⚡8 credits per generation`,

    audioSunoDesc: `🎸 <b>SUNO — Music Generator</b>

Create original songs, covers, and instrumentals powered by AI.

💡 Set your generation mode and music style in SUNO Settings, then describe the song you want.

Fee: ⚡80 credits (you'll receive 2 variations)`,

    audioSoundGenDesc: `🥁 <b>Sound Generator</b>

Create sound effects, ambient audio, and short compositions from text descriptions.

💡 Fine-tune creativity parameters in Sound Settings, then describe the sound you need.
Example: "birds singing in a forest at dawn"

Fee: ⚡10 credits per generation`,

    audioAccessDenied: 'is not available on your current plan.',
    audioUpgradeHint: 'Upgrade your subscription to access this feature.',

    // Image Functions
    imageFamilySelect: `🖼 <b>Image AI</b>

Choose a model family:`,

    imageFluxFamilyDesc: `🔥 <b>Flux Family</b>

Black Forest Labs Flux models — from fast drafts to premium quality.

Select a model:`,

    imageDalleFamilyDesc: `✨ <b>DALL-E</b>

OpenAI's image generation models — reliable and versatile.

Select a model:`,

    imageMidjourneyFamilyDesc: `🎨 <b>Midjourney</b>

Artistic image generation — stunning, creative, highly detailed.

Select a model:`,


    imageSeedreamFamilyDesc: `🌱 <b>Seedream</b>

ByteDance Seedream — high-quality image generation and editing. Choose between the proven 4.0 or the latest 4.5 Beta with resolution control.

Select a model:`,

    imageFluxSchnellDesc: `⚡ <b>Flux Schnell</b>

Fast and affordable image generation by Black Forest Labs. Great for quick iterations and drafts.

💡 Adjust aspect ratio in Image Settings, then send a text prompt to generate.

Fee: ⚡2 credits per image`,

    imageFluxKontextDesc: `🎨 <b>Flux Kontext</b>

Context-aware image generation and editing with Flux Kontext Pro.

🌄 Send a reference image + ✍️ text prompt to edit an existing image.
✍️ Or just send a text prompt to generate from scratch.

💡 Adjust aspect ratio in Image Settings.

Fee: ⚡5 credits per image`,

    imageFluxDevDesc: `🔧 <b>Flux Dev</b>

High-quality image generation for development and creative work. Great balance of quality and speed.

💡 Adjust aspect ratio in Image Settings, then send a text prompt to generate.

Fee: ⚡12 credits per image`,

    imageFluxProDesc: `💎 <b>Flux Pro</b>

Premium Flux Pro v1.1 — the best quality in the Flux family. Ideal for final production images.

💡 Adjust aspect ratio in Image Settings, then send a text prompt to generate.

Fee: ⚡20 credits per image`,

    imageDallE2Desc: `🎨 <b>DALL-E 2</b>

OpenAI's fast and affordable image model. Good for simple illustrations and quick concepts.

💡 Generates square images (1024×1024). Send a text prompt to generate.

Fee: ⚡10 credits per image`,

    imageDallE3Desc: `✨ <b>DALL-E 3</b>

OpenAI's premium image model with excellent prompt understanding and high quality output.

💡 Adjust aspect ratio, quality, and style in Image Settings, then send a text prompt.

Fee: ⚡25 credits per image`,

    imageMidjourneyDesc: `🎨 <b>Midjourney</b>

Artistic image generation with one of the most popular AI art tools.

🌄 Send a reference image + ✍️ text prompt to transform an existing image.
✍️ Or just send a text prompt to generate from scratch.

💡 Adjust aspect ratio, version, stylize, speed, and weirdness in Image Settings.

Fee: ⚡8–22 credits (depends on speed mode)`,

    imageNanoBananaDesc: `🍌 <b>Nano Banana</b>

Google Gemini 2.5 Flash — fast and affordable image generation.

🌄 Send a reference image + ✍️ text prompt to edit an existing image.
✍️ Or just send a text prompt to generate from scratch.

💡 Adjust aspect ratio in Image Settings.

Fee: ⚡6 credits per image`,

    imageNanoBananaProDesc: `🍌 <b>Nano Banana Pro</b>

Google Gemini image generation — powerful quality with excellent detail.

🌄 Send a reference image + ✍️ text prompt to edit an existing image.
✍️ Or just send a text prompt to generate from scratch.

💡 Adjust aspect ratio and resolution in Image Settings.

Fee: ⚡20 credits per image`,

    imageSeedreamDesc: `🌱 <b>Seedream 4.0</b>

ByteDance Seedream — high-quality image generation and editing with excellent detail and creativity.

🌄 Send a reference image + ✍️ text prompt to edit an existing image.
✍️ Or just send a text prompt to generate from scratch.

💡 Adjust aspect ratio in Image Settings.

Fee: ⚡5 credits per image`,

    imageSeedream45Desc: `🌱 <b>Seedream 4.5 Beta</b>

ByteDance's latest image model — improved quality, creativity, and resolution control up to 4K.

🌄 Send a reference image + ✍️ text prompt to edit an existing image.
✍️ Or just send a text prompt to generate from scratch.

💡 Adjust aspect ratio and resolution (1K/2K/4K) in Image Settings.

Fee: ⚡8–15 credits (depends on resolution)`,

    imageAccessDenied: 'is not available on your current plan.',
    imageUpgradeHint: 'Upgrade your subscription to access this feature.',

    // Video Functions
    videoFamilySelect: `🎬 <b>Video AI</b>

Choose a model family:`,

    videoKlingFamilyDesc: `🎥 <b>Kling</b>

Professional video generation by Kuaishou. Smooth motion, cinematic quality, and excellent prompt adherence.

Select a model:`,

    videoVeoFamilyDesc: `🌐 <b>Google Veo</b>

Google's next-gen video generation — photorealistic output with optional audio.

Select a model:`,

    videoSoraFamilyDesc: `🎬 <b>Sora</b>

OpenAI's advanced video generation — from standard to premium pro quality.

Select a model:`,

    videoRunwayFamilyDesc: `✈️ <b>Runway</b>

Professional-grade Gen-4 video generation with cinematic output. Choose between standard quality or fast Turbo mode.

Select a model:`,

    videoLumaFamilyDesc: `💫 <b>Luma Dream Machine</b>

Fast AI video generation with stunning visual quality. Supports text prompts and image-to-video.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡18 credits`,

    videoWanFamilyDesc: `🌊 <b>WAN 2.5</b>

Open-source video generation model — affordable and versatile. Great for quick iterations and creative experiments.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡10 credits`,

    videoSeedanceFamilyDesc: `🌱 <b>Seedance</b>

ByteDance's advanced video generation family. Known for multi-scene storytelling, high-quality animation, and impressive motion quality.

Choose a version:
• <b>1.0 Lite</b> — affordable 720p (⚡8–24)
• <b>1.0 Pro</b> — highest quality 1080p (⚡30–90)
• <b>1.0 Fast</b> — fast 1080p generation (⚡12–36)
• <b>1.5 Pro</b> — latest model (⚡15–45)`,

    videoKlingDesc: `🎥 <b>Kling Standard</b>

Professional video generation with smooth motion and natural dynamics. Choose from multiple Kling versions (v1.5–v2.6).

💡 Configure version, duration, creativity, and more in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡12–32 credits (depends on settings)`,

    videoKlingProDesc: `💎 <b>Kling Pro</b>

Premium Kling model — higher quality, all versions including 2.1-Master, with optional native audio.

💡 Configure version, duration, creativity, audio, and more in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡20–116 credits (depends on settings)`,

    videoVeoFastDesc: `⚡ <b>Veo 3.1 Fast</b>

Google Veo fast mode — quick video generation with great quality and optional audio.

💡 Adjust aspect ratio, duration, resolution (up to 4K), audio, and image processing mode in Video Settings.
📸 <b>Image modes:</b> Frames (start+end images → transition) or Ingredients (reference images → scene).

Send ✍️ a text prompt to get started, or 🌄 upload images for Frames/Ingredients mode 👇

Fee: ⚡9–40 credits (depends on settings)`,

    videoVeoDesc: `💎 <b>Veo 3.1 Quality</b>

Google Veo quality mode — maximum fidelity, photorealism, and optional audio generation.

💡 Adjust aspect ratio, duration, resolution (up to 4K), audio, and image processing mode in Video Settings.
📸 <b>Image modes:</b> Frames (start+end images → transition) or Ingredients (reference images → scene).

Send ✍️ a text prompt to get started, or 🌄 upload images for Frames/Ingredients mode 👇

Fee: ⚡34–160 credits (depends on settings)`,

    videoSoraDesc: `🎬 <b>Sora 2</b>

OpenAI Sora 2 — text-to-video and image-to-video with resolutions up to 1080p and durations up to 15s.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to create a video 👇

Fee: ⚡9–57 credits (depends on settings)`,

    videoSoraProDesc: `💎 <b>Sora 2 Pro</b>

OpenAI Sora 2 Pro — premium quality video generation with higher fidelity and detail. Durations up to 15s.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to create a video 👇

Fee: ⚡40–150 credits (depends on settings)`,

    videoRunwayDesc: `⚡ <b>Runway Gen-4 Turbo</b>

Fast video generation with cinematic output. Optimized for speed while maintaining quality.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload images to get started 👇
⚠️ Note: 10s videos at 1080p are not supported (auto-downgrades to 720p).

Fee: ⚡15–45 credits (depends on settings)`,

    videoRunwayGen4Desc: `✈️ <b>Runway Gen-4</b>

Professional-grade Gen-4 video generation — standard quality with enhanced detail and consistency.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload images to get started 👇
⚠️ Note: 10s videos at 1080p are not supported (auto-downgrades to 720p).

Fee: ⚡20–60 credits (depends on settings)`,

    videoLumaDesc: `💫 <b>Luma Dream Machine</b>

Fast AI video generation with stunning visual quality. Supports text-to-video and image-to-video.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡18 credits`,

    videoWanDesc: `🌊 <b>WAN 2.5</b>

Open-source video generation — affordable and versatile. Great for quick iterations.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡10 credits`,

    videoSeedanceLiteDesc: `🌱 <b>Seedance 1.0 Lite</b>

Affordable 720p video generation from ByteDance. Great for quick iterations and previews.

💡 Adjust duration and aspect ratio in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡8–24 credits (depends on duration)`,

    videoSeedanceProDesc: `💎 <b>Seedance 1.0 Pro</b>

Highest quality 1080p video from ByteDance. Best for final renders and premium content.

💡 Adjust duration and aspect ratio in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡30–90 credits (depends on duration)`,

    videoSeedanceFastDesc: `⚡ <b>Seedance 1.0 Fast</b>

Fast 1080p video generation — great balance of speed and quality.

💡 Adjust duration and aspect ratio in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡12–36 credits (depends on duration)`,

    videoSeedanceDesc: `🌱 <b>Seedance 1.5 Pro</b>

Latest Seedance model from ByteDance. Multi-scene storytelling, high-quality animation, and impressive motion.

💡 Adjust duration in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡15–45 credits (depends on duration)`,

    videoAccessDenied: 'is not available on your current plan.',
    videoUpgradeHint: 'Upgrade your subscription to access this feature.',

    // Model Selection
    modelSelected: `✅ <b>{modelName}</b> selected ({tokenCost})

Send your prompt:
{example}`,

    // Processing
    processing: '⏳ Processing with {modelName}...',
    processingStart: '🚀 <b>{modelName}</b>\n\n⏳ Starting generation...',
    processingGenerating: '🎨 <b>{modelName}</b>\n\n⏳ Generating, this may take a few minutes...',
    processingAlmostDone: '🎨 <b>{modelName}</b>\n\n✨ Almost done...',
    done: '✅ Done! Send another prompt or choose a new model:',
    continueHint: '💡 Send another prompt for <b>{modelName}</b> or choose from the menu.',
    cancelled: 'Cancelled.',

    // Errors
    errorGeneric: 'An error occurred. Please try again.',
    errorInsufficientBalance: 'Insufficient balance. You need {required} but have {current}.',
    errorModelNotFound: 'Model not found.',
    errorRefunded: `❌ <b>Generation Failed</b>

{error}

💰 Your credits have been refunded.`,

    // No models
    noModels: 'No models available in this category yet.',
  },

  // Prompt examples
  promptExamples: {
    TEXT: 'Example: "Explain quantum computing in simple terms"',
    IMAGE: 'Example: "A cyberpunk city at sunset, neon lights, rain"',
    VIDEO: 'Example: "A timelapse of a flower blooming"',
    AUDIO: 'Example: "Hello, welcome to our podcast!"',
  },
};

export type Locale = typeof en;
