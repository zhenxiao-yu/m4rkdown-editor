# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | Yes |
| Older releases | No |

M4rkdown is a client-side PWA. There is no backend beyond the PartyKit arena server. The attack surface is limited to:

- XSS via Markdown rendering (mitigated by DOMPurify on all rendered output)
- WebSocket message injection in the arena (server validates all game messages)
- Local storage data exposure (all data is local to the user's device)

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email **markyu0615@gmail.com** with:

1. A description of the vulnerability and its potential impact
2. Steps to reproduce or a proof-of-concept
3. Your suggested fix (optional but appreciated)

You can expect an acknowledgement within **48 hours** and a fix or mitigation plan within **7 days** for confirmed vulnerabilities.

We will credit you in the release notes unless you prefer to remain anonymous.
