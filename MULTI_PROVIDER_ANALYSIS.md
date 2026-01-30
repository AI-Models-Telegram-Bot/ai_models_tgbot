# Multi-Provider Architecture - Analysis & Fix Plan

## Current Problems

### 1. Provider APIs Don't Match Implementation
- **Runware**: Uses WebSocket (`wss://ws-api.runware.ai/v1`), not REST - completely incompatible with axios
- **Kie.ai**: No documentation found - likely doesn't exist or uses different protocol
- **AI/ML API**: ✅ Works - OpenAI-compatible at `https://api.aimlapi.com/v1`
- **PiAPI**: ✅ Works - OpenAI-compatible
- **OpenRouter**: ✅ Works - OpenAI-compatible at `https://openrouter.ai/api/v1`

### 2. Model Selection Confusion
- User selects "GPT-4o" (specific model tied to OpenAI)
- But ProviderManager tries ALL providers (aimlapi, piapi, openrouter, openai)
- Each provider receives `{model: "gpt-4o"}` which they don't understand
- Result: All fail except OpenAI

### 3. No Provider Tracking
- Request table doesn't store which provider actually served the request
- Can't see fallback working
- Can't track costs per provider

## Correct Architecture

### Phase 1: Make it Work (Simple)
1. **Keep only OpenAI-compatible providers for TEXT**:
   - AIMLAPI (priority 1)
   - PiAPI (priority 2)
   - OpenRouter (priority 3)
   - OpenAI (priority 4)
   - Anthropic (priority 5)
   - XAI (priority 6)

2. **For IMAGE/VIDEO/AUDIO - use existing providers only**:
   - These work fine with Replicate, OpenAI, ElevenLabs

3. **Make providers model-agnostic**:
   - Don't pass model slugs to providers
   - Each provider uses its own best/default model
   - User-facing model names are just labels

4. **Add provider tracking**:
   - Add `actualProvider` field to Request table
   - Log which provider served each request

### Phase 2: Advanced (Later)
- Integrate proper Runware SDK (WebSocket support)
- Add more providers as they become available
- Smart routing based on cost/performance stats

## Implementation Steps

1. ✅ Remove incompatible providers (Runware, Kie.ai)
2. ✅ Fix remaining providers to be model-agnostic
3. ✅ Add migration for `actualProvider` field in Request table
4. ✅ Update worker to track provider usage
5. ✅ Update ProviderManager to not pass model slugs
6. ✅ Test fallback behavior
