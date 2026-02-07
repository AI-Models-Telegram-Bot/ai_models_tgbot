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
    errorRefunded: `❌ Error: {error}

Your tokens have been refunded.`,

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
