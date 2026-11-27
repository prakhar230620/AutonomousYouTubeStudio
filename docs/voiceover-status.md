# Voiceover provider status

Observed endpoint: the separate Vercel Voiceover Studio project contains a `/api/fish` route using Vercel Connect and MessagePack streaming. The request/response shape, required headers and output framing are not yet confirmed from the provider client code.

Therefore this repository intentionally does not send fabricated requests to that endpoint. Once the original client contract is confirmed, implement a server-only adapter that streams the bytes to private storage, checks MIME/sample rate/channels and audio energy, measures actual duration, and returns optional word/phrase alignment data.
