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
    imageGoogleAIFamily: '🍌 Nano Banana Pro',
    imageSeedreamFamily: '🌱 Seedream',
    // Image Models
    imageFluxSchnell: '⚡ Flux Schnell (⚡2)',
    imageFluxKontext: '🎨 Flux Kontext (⚡5)',
    imageFluxDev: '🔧 Flux Dev (⚡12)',
    imageFluxPro: '💎 Flux Pro (⚡20)',
    imageDallE2: '🎨 DALL-E 2 (⚡10)',
    imageDallE3: '✨ DALL-E 3 (⚡25)',
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
    videoKling: '🎥 Kling (⚡12)',
    videoKlingPro: '💎 Kling Pro (⚡20)',
    videoKlingMaster: '👑 Kling Master (⚡40)',
    videoVeoFast: '⚡ Veo Fast (⚡9–20)',
    videoVeoQuality: '💎 Veo Quality (⚡34–80)',
    videoSettings: '🎛️ Video Settings',
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

💰 <b>Balances</b>
🤖 Text: {textBalance} credits
🖼 Image: {imageBalance} credits
🎬 Video: {videoBalance} credits
🎵 Audio: {audioBalance} credits

<b>Total spent:</b> ${'{totalSpent}'} USD

🔗 <b>Referral Program</b>
Your code: <code>{referralCode}</code>
Referrals: {referralCount}
Credits earned: {referralBonus} ⚡

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

    imageGoogleAIFamilyDesc: `🍌 <b>Nano Banana Pro</b>

Cutting-edge image generation powered by Google Gemini.

Select a model:`,

    imageSeedreamFamilyDesc: `🌱 <b>Seedream</b>

ByteDance Seedream 4.0 — high-quality image generation and editing.

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

💡 Adjust aspect ratio, version, and stylize in Image Settings.

Fee: ⚡25 credits per image`,

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

An advanced AI model by OpenAI capable of transforming text descriptions or images into dynamic videos with resolutions up to 1080p.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to create a video 👇

Fee: ⚡9–57 credits (depends on settings)`,

    videoRunwayFamilyDesc: `✈️ <b>Runway Gen-4 Turbo</b>

Professional-grade video generation with cinematic output. Send a text prompt or upload up to 3 images to generate a video.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload images to get started 👇
⚠️ Note: 10s videos at 1080p are not supported (auto-downgrades to 720p).

Fee: ⚡15–45 credits (depends on settings)`,

    videoLumaFamilyDesc: `💫 <b>Luma Dream Machine</b>

Fast AI video generation with stunning visual quality. Supports text prompts and image-to-video.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡18 credits`,

    videoWanFamilyDesc: `🌊 <b>WAN 2.5</b>

Open-source video generation model — affordable and versatile. Great for quick iterations and creative experiments.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡10 credits`,

    videoSeedanceFamilyDesc: `🌱 <b>Seedance 1.5</b>

An advanced video generation model from ByteDance. Known for multi-scene storytelling, high-quality animation, and impressive motion quality — especially useful for content creators and visual artists.

💡 Adjust duration in Video Settings.

Upload up to 2 images and/or send a text prompt to get started 👇

Fee: ⚡5–15 credits (depends on settings)`,

    videoKlingDesc: `🎥 <b>Kling Standard</b>

Professional video generation with smooth motion and natural dynamics. Animate images or send a text prompt to create cinematic videos.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡12 credits`,

    videoKlingProDesc: `💎 <b>Kling Pro</b>

Premium Kling model — higher quality, 10-second extended videos with detailed output.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡20 credits`,

    videoKlingMasterDesc: `👑 <b>Kling Master</b>

The highest quality Kling model — cinematic detail, superior motion coherence, and best-in-class output.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡40 credits`,

    videoVeoFastDesc: `⚡ <b>Veo 3.1 Fast</b>

Google Veo fast mode — quick video generation with great quality and optional audio.
⚠️ Text-only — reference images are not supported.

💡 Adjust aspect ratio, duration, resolution, and audio in Video Settings.

Send ✍️ a text prompt to get started 👇

Fee: ⚡9–20 credits (depends on settings)`,

    videoVeoDesc: `💎 <b>Veo 3.1 Quality</b>

Google Veo quality mode — maximum fidelity, photorealism, and optional audio generation.
⚠️ Text-only — reference images are not supported.

💡 Adjust aspect ratio, duration, resolution, and audio in Video Settings.

Send ✍️ a text prompt to get started 👇

Fee: ⚡34–80 credits (depends on settings)`,

    videoSoraDesc: `🎬 <b>Sora</b>

An advanced AI model by OpenAI capable of transforming text descriptions or images into dynamic videos with resolutions up to 1080p.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload an image to create a video 👇

Fee: ⚡9–57 credits (depends on settings)`,

    videoRunwayDesc: `✈️ <b>Runway Gen-4 Turbo</b>

Professional-grade video generation with cinematic output. Send a text prompt or upload up to 3 images.

💡 Adjust duration and resolution in Video Settings.

Send ✍️ a text prompt or 🌄 upload images to get started 👇
⚠️ Note: 10s videos at 1080p are not supported (auto-downgrades to 720p).

Fee: ⚡15–45 credits (depends on settings)`,

    videoLumaDesc: `💫 <b>Luma Dream Machine</b>

Fast AI video generation with stunning visual quality. Supports text-to-video and image-to-video.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡18 credits`,

    videoWanDesc: `🌊 <b>WAN 2.5</b>

Open-source video generation — affordable and versatile. Great for quick iterations.

Send ✍️ a text prompt or 🌄 upload an image to get started 👇

Fee: ⚡10 credits`,

    videoSeedanceDesc: `🌱 <b>Seedance 1.5</b>

An advanced video generation model from ByteDance. Known for multi-scene storytelling, high-quality animation, and impressive motion quality.

💡 Adjust duration in Video Settings.

Upload up to 2 images and/or send a text prompt to get started 👇

Fee: ⚡5–15 credits (depends on settings)`,

    videoAccessDenied: 'is not available on your current plan.',
    videoUpgradeHint: 'Upgrade your subscription to access this feature.',

    // Model Selection
    modelSelected: `✅ <b>{modelName}</b> selected ({tokenCost})

Send your prompt:
{example}`,

    // Processing
    processing: '⏳ Processing with {modelName}...',
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
