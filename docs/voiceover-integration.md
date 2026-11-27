# Voiceover integration contract

The existing Vercel Voiceover Studio route was observed to use Vercel Connect and MessagePack streaming. Its exact request/response contract has not yet been verified.

The adapter must accept final narration text, voice profile ID, language (e.g. `hi-IN`), optional pronunciation dictionary and style. It must return a private object-storage key, measured duration in milliseconds, MIME type, sample rate, channels, provider request ID and optional word/phrase timestamps.

Call only from a server-side adapter. Do not guess the MessagePack schema or auth headers. Preserve binary chunks, verify integrity and non-zero audio energy, and measure duration from the completed audio file. Automated calls remain disabled until a controlled Hindi test confirms protocol, pronunciation, timing and audio integrity.
