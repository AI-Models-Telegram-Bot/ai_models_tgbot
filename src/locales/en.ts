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
    // Video Models
    videoKling: '🎥 Kling (⚡50)',
    videoKlingPro: '💎 Kling Pro (⚡100)',
    videoVeoFast: '⚡ Veo Fast (⚡200)',
    videoVeoQuality: '💎 Veo Quality (⚡500)',
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
Bonus earned: {referralBonus}

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

<b>Get Free Tokens:</b>
• Refer friends: {referralBonus} tokens per referral
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

    imageFluxSchnellDesc: `⚡ <b>Flux Schnell</b>

Fast and affordable image generation by Black Forest Labs. Great for quick iterations and drafts.

💡 Adjust aspect ratio in Image Settings, then send a text prompt to generate.

Fee: ⚡2 credits per image`,

    imageFluxKontextDesc: `🎨 <b>Flux Kontext</b>

Context-aware image generation with Flux Kontext Pro. Excellent for coherent, detailed scenes.

💡 Adjust aspect ratio in Image Settings, then send a text prompt to generate.

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

💡 Adjust aspect ratio, version, and stylize in Image Settings, then send a text prompt.

Fee: ⚡25 credits per image`,

    imageNanoBananaProDesc: `🍌 <b>Nano Banana Pro</b>

Google Gemini image generation — powerful quality with excellent detail.

💡 Adjust aspect ratio and resolution in Image Settings, then send a text prompt.

Fee: ⚡20 credits per image`,

    imageAccessDenied: 'is not available on your current plan.',
    imageUpgradeHint: 'Upgrade your subscription to access this feature.',

    // Video Functions
    videoFamilySelect: `🎬 <b>Video AI</b>

Choose a model family:`,

    videoKlingFamilyDesc: `🎥 <b>Kling</b>

Professional video generation by Kuaishou — smooth motion, cinematic quality.

Select a model:`,

    videoVeoFamilyDesc: `🌐 <b>Google Veo</b>

Google's next-gen video generation — photorealistic output with optional audio.

Select a model:`,

    videoSoraFamilyDesc: `🎬 <b>Sora</b>

OpenAI's text-to-video model — creative, imaginative video generation.

💡 Adjust aspect ratio, duration, and resolution in Video Settings.

Fee: ⚡250 credits per video`,

    videoRunwayFamilyDesc: `✈️ <b>Runway</b>

Runway Gen-4 Turbo — fast, high-quality video generation for professionals.

💡 Adjust aspect ratio, duration, and resolution in Video Settings.

Fee: ⚡150 credits per video`,

    videoLumaFamilyDesc: `💫 <b>Luma Dream Machine</b>

Fast AI video generation with stunning visual quality.

Send a text prompt to generate a video.

Fee: ⚡50 credits per video`,

    videoWanFamilyDesc: `🌊 <b>WAN</b>

Open-source video generation model — affordable and versatile.

Send a text prompt to generate a video.

Fee: ⚡30 credits per video`,

    videoKlingDesc: `🎥 <b>Kling Standard</b>

Professional video generation with smooth motion and natural dynamics.

💡 Adjust aspect ratio in Video Settings, then send a text prompt to generate.

Fee: ⚡50 credits per video`,

    videoKlingProDesc: `💎 <b>Kling Pro</b>

Premium Kling model — higher quality, more detailed output.

💡 Adjust aspect ratio in Video Settings, then send a text prompt to generate.

Fee: ⚡100 credits per video`,

    videoVeoFastDesc: `⚡ <b>Veo Fast</b>

Google Veo 3.1 fast mode — quick video generation with great quality.

💡 Adjust aspect ratio, duration, resolution, and audio in Video Settings.

Fee: ⚡200 credits per video`,

    videoVeoDesc: `💎 <b>Veo Quality</b>

Google Veo 3.1 quality mode — maximum fidelity and photorealism.

💡 Adjust aspect ratio, duration, resolution, and audio in Video Settings.

Fee: ⚡500 credits per video`,

    videoSoraDesc: `🎬 <b>Sora</b>

OpenAI's text-to-video — creative and imaginative video generation.

💡 Adjust aspect ratio, duration, and resolution in Video Settings.

Fee: ⚡250 credits per video`,

    videoRunwayDesc: `✈️ <b>Runway Gen-4 Turbo</b>

Professional video generation with cinematic output.

💡 Adjust aspect ratio, duration, and resolution in Video Settings.
⚠️ Note: 10s videos at 1080p are not supported (auto-downgrades to 720p).

Fee: ⚡150 credits per video`,

    videoLumaDesc: `💫 <b>Luma Dream Machine</b>

Fast AI video generation with stunning visual quality.

Send a text prompt to generate a video.

Fee: ⚡50 credits per video`,

    videoWanDesc: `🌊 <b>WAN</b>

Open-source video generation — affordable and versatile.

Send a text prompt to generate a video.

Fee: ⚡30 credits per video`,

    videoAccessDenied: 'is not available on your current plan.',
    videoUpgradeHint: 'Upgrade your subscription to access this feature.',

    // Model Selection
    modelSelected: `✅ <b>{modelName}</b> selected ({tokenCost})

Send your prompt:
{example}`,

    // Processing
    processing: '⏳ Processing with {modelName}...',
    done: '✅ Done! Send another prompt or choose a new model:',
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
