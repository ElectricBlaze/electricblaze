# electricblaze

Social feeds for sites that AI writes. Instagram, TikTok and YouTube data with
authorization, cache and repair of breaking APIs. The UI is yours (or your
agent's); the data layer is ours.

**Status: 0.0.1 reserves the name. The CLI ships in 0.1.**

Planned surface, all commands non-interactive, all support `--json`:

```
npx electricblaze add instagram-feed   # component into your project, demo data, .env.example
npx electricblaze preview instagram    # feed JSON in stdout (demo if not connected)
npx electricblaze doctor               # keys, domain, quotas, token expiry
npx electricblaze login                # device flow
npx electricblaze connect instagram    # prints a URL, polls, exits 2 on timeout
```

Until then: https://electricblaze.com

License: MIT
