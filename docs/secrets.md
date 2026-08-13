# Secrets inventory

**This file never contains a secret value.** It lists names, what each is for, and where the
real value lives. If you find yourself pasting something that looks like a key into this file,
stop.

## Where values live

1. **A password manager** — the canonical backup. Entry name matches the secret name below.
2. **The runtime's secret store** — what the application actually reads.

**Order matters: password manager first, then the runtime.** A value that exists only in a
runtime store is one accidental rotation away from being gone forever.

## Rules

- Code references secrets by name only. Never inline a value, not even temporarily.
- Never commit a value. Not in a `.env`, not in a comment, not in a test fixture.
- Never paste a value into chat, a ticket, or a document. A value that has passed through a
  transcript should be treated as compromised and rotated at leisure.
- **Never echo a secret to check whether it is set.** Check its length, or the first few
  characters of a hash. A presence check has leaked a live key before.
- Prefer a secret you control over one the platform rotates for you. A platform that silently
  rotates a value will eventually do it at the worst moment, and the symptom — a sudden storm
  of auth failures with no code change — looks exactly like a code regression.

## Adding a secret

1. Generate the value (`openssl rand -base64 32` for a 256-bit key).
2. Save it in the password manager **first**, named `<project> — <SECRET_NAME>`.
3. Set it in the runtime secret store.
4. Add a row to the table below.
5. Reference it in code by name.

## Inventory

| Name | Purpose | Vault entry | Notes |
|---|---|---|---|
| _none yet_ | | | |
