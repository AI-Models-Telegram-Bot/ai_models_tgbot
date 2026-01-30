# ✅ Multi-Provider Architecture - Complete Implementation

## What Was Fixed

### 1. **Provider Tracking**
- ✅ Added `actualProvider` field to Request table
- ✅ Updated RequestService to save which provider served each request
- ✅ Worker now logs and stores the actual provider used

### 2. **Model-Agnostic Architecture**
- ✅ Removed model-specific slug passing to providers
- ✅ Each provider uses its own best/default model
- ✅ User-facing models are just labels - backend uses any available provider

### 3. **Provider Manager Return Type**
- ✅ Changed from `Promise<any>` to `Promise<{ result, provider }>`
- ✅ Worker extracts both result and provider name
- ✅ Provider name is saved to Request.actualProvider

### 4. **Simplified Provider Configuration**
- ❌ Removed Runware (uses WebSocket, not REST)
- ❌ Removed Kie.ai (no documentation, incompatible protocol)
- ✅ Kept working providers: AIMLAPI, PiAPI, OpenRouter, OpenAI, Anthropic, XAI, Replicate, ElevenLabs

---

## Current Provider Architecture

### **TEXT Generation** (6 providers with automatic fallback)
1. **AIMLAPI** (priority 1) - $0.0015/1k tokens
2. **PiAPI** (priority 2) - $0.0012/1k tokens
3. **OpenRouter** (priority 3) - $0.002/1k tokens
4. **OpenAI** (priority 4) - $0.0025/1k tokens (GPT-4o)
5. **Anthropic** (priority 5) - $0.003/1k tokens (Claude)
6. **XAI** (priority 6) - $0.005/1k tokens (Grok)

### **IMAGE Generation** (2 providers with automatic fallback)
1. **Replicate** (priority 1) - $0.003-0.04/image (Flux)
2. **OpenAI** (priority 2) - $0.04/image (DALL-E 3)

### **VIDEO Generation** (1 provider)
1. **Replicate** (priority 1) - Kling/Luma models

### **AUDIO Generation** (2 providers with automatic fallback)
1. **ElevenLabs** (priority 1) - TTS
2. **Replicate** (priority 2) - Suno/Bark models

---

## How It Works

### Request Flow
```
User Selects "Text AI" (model is just a label)
    ↓
Worker calls: manager.generate('TEXT', 'generateText', prompt)
    ↓
ProviderManager tries providers in priority order:
    1. Try AIMLAPI → Success! Return {result, provider: "aimlapi"}
    2. If failed, try PiAPI
    3. If failed, try OpenRouter
    4. If failed, try OpenAI
    5. ... (continues through all enabled providers)
    ↓
Worker saves:
    - result to user
    - actualProvider = "aimlapi" to Request table
```

### Database Schema
```sql
-- Request table now has:
actual_provider VARCHAR -- Stores which provider served the request

-- Example row:
{
  id: "req_123",
  userId: "user_456",
  modelId: "model_gpt4o",  -- User-facing label
  inputText: "Hello world",
  outputText: "Hi there!",
  status: "COMPLETED",
  actualProvider: "aimlapi"  -- Actual backend provider used
}
```

### Provider Priority Configuration
Located in [src/config/providers.config.ts](src/config/providers.config.ts):

```typescript
export const PROVIDER_CONFIGS = {
  text_aimlapi: { name: 'aimlapi', enabled: true, priority: 1, apiKey: process.env.AIMLAPI_KEY },
  text_piapi: { name: 'piapi', enabled: true, priority: 2, apiKey: process.env.PIAPI_KEY },
  // ... etc
};
```

Change `priority` numbers to reorder providers. Lower number = tried first.

---

## API Endpoints

### Get Provider Statistics
```bash
# All providers across all categories
curl http://localhost:3000/api/providers/stats

# Response:
[
  {
    "category": "TEXT",
    "provider": "aimlapi",
    "priority": 1,
    "enabled": true,
    "requests": 45,
    "successes": 44,
    "failures": 1,
    "successRate": 97.78,
    "totalCost": 0.0675,
    "avgCost": 0.0015,
    "avgTime": 1250
  },
  // ...
]
```

### Get Category-Specific Stats
```bash
curl http://localhost:3000/api/providers/stats/TEXT
```

### Get Cost Comparison (sorted by cheapest)
```bash
curl http://localhost:3000/api/providers/cost/IMAGE

# Response: providers sorted by avgCost
[
  { "provider": "replicate", "avgCost": 0.003, "successRate": 100 },
  { "provider": "openai", "avgCost": 0.04, "successRate": 98 }
]
```

### Get Recommended Provider
```bash
curl http://localhost:3000/api/providers/recommended/TEXT

# Response:
{ "recommended": "piapi" }  // Cheapest with >80% success rate
```

---

## Testing the Multi-Provider Fallback

### 1. Start the bot and worker
```bash
npm run dev
npm run dev:worker
```

### 2. Send a text message through Telegram bot

### 3. Check logs for fallback behavior
```bash
tail -f logs/combined.log | grep "Trying\|succeeded"

# Expected output:
[info] Trying aimlapi for TEXT
[info] ✓ aimlapi succeeded for TEXT
[info] Request req_abc123 served by provider: aimlapi
```

### 4. Check database
```bash
psql ai_bot_db -c "SELECT id, input_text, actual_provider, status FROM requests ORDER BY created_at DESC LIMIT 5;"

# Should see actualProvider populated:
id        | input_text    | actual_provider | status
----------|---------------|-----------------|----------
req_123   | Hello world   | aimlapi         | COMPLETED
req_122   | Generate code | piapi           | COMPLETED  (fallback!)
req_121   | Test prompt   | openai          | COMPLETED  (double fallback!)
```

### 5. Test fallback by disabling primary provider
Edit [src/config/providers.config.ts](src/config/providers.config.ts):
```typescript
text_aimlapi: { enabled: false, ... }  // Disable primary
```

Restart worker, send message → should use piapi (priority 2)

---

## Cost Tracking

Every request now tracks:
- **Which provider** served it (`actualProvider`)
- **Estimated cost** (tracked in ProviderManager stats)
- **Processing time** (ms)

View costs:
```bash
# Total cost per provider
curl http://localhost:3000/api/providers/stats | jq '.[] | select(.category == "TEXT") | {provider, totalCost, avgCost}'

# Response:
{ "provider": "aimlapi", "totalCost": 0.067, "avgCost": 0.0015 }
{ "provider": "piapi", "totalCost": 0.024, "avgCost": 0.0012 }
{ "provider": "openai", "totalCost": 0.125, "avgCost": 0.0025 }
```

---

## Environment Variables

Add new provider keys to `.env`:
```bash
# New providers (optional - fallback to existing if empty)
AIMLAPI_KEY=your_key_here
PIAPI_KEY=your_key_here
OPENROUTER_KEY=your_key_here

# Existing providers
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
REPLICATE_API_TOKEN=...
ELEVENLABS_API_KEY=...
```

Providers without keys are automatically skipped.

---

## Key Benefits

✅ **Automatic Fallback**: If primary provider fails, tries secondary, tertiary, etc.
✅ **Cost Optimization**: Use cheapest provider first, track actual costs
✅ **Provider Visibility**: See which provider served each request
✅ **Zero Downtime**: Never fails if at least one provider works
✅ **Easy Configuration**: Change priorities without code changes
✅ **Load Distribution**: Spread requests across multiple APIs
✅ **Future-Proof**: Easy to add new OpenAI-compatible providers

---

## Monitoring & Analytics

### Dashboard Queries

**Provider success rates:**
```sql
SELECT
  actual_provider,
  COUNT(*) as total_requests,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM requests
WHERE actual_provider IS NOT NULL
GROUP BY actual_provider
ORDER BY total_requests DESC;
```

**Fallback frequency:**
```sql
-- How often does each provider actually get used?
SELECT
  m.provider as user_selected_provider,
  r.actual_provider,
  COUNT(*) as times_used
FROM requests r
JOIN ai_models m ON r.model_id = m.id
WHERE r.actual_provider IS NOT NULL
GROUP BY m.provider, r.actual_provider
ORDER BY times_used DESC;
```

**Cost analysis:**
```sql
-- Compare user-facing model vs actual provider
SELECT
  m.name as user_model,
  m.provider as expected_provider,
  r.actual_provider,
  COUNT(*) as requests,
  m.token_cost as model_credit_cost
FROM requests r
JOIN ai_models m ON r.model_id = m.id
WHERE r.actual_provider IS NOT NULL
GROUP BY m.name, m.provider, r.actual_provider, m.token_cost;
```

---

## Sources

- **AI/ML API Documentation**: https://docs.aimlapi.com
- **Runware AI Analysis**: https://runware.ai/docs/en/getting-started/introduction (WebSocket-based, not integrated)

---

## Next Steps

Want to add more providers? Follow this checklist:

1. ✅ Check if provider has OpenAI-compatible REST API
2. ✅ Create new provider class extending `EnhancedProvider`
3. ✅ Add config to [src/config/providers.config.ts](src/config/providers.config.ts)
4. ✅ Register in [src/config/providerFactory.ts](src/config/providerFactory.ts)
5. ✅ Set priority (lower = tried first)
6. ✅ Add API key to `.env`
7. ✅ Restart worker

**Provider Requirements:**
- Must have REST HTTP API (not WebSocket)
- Should be OpenAI-compatible for text (easier integration)
- Must return consistent result format ({text}, {imageUrl}, {videoUrl}, {audioUrl})

Done! 🎉
