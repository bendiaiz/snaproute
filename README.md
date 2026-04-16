# snaproute

Lightweight URL shortener with analytics dashboard built on Edge functions.

## Installation

```bash
npm install snaproute
```

## Usage

```typescript
import { Snaproute } from "snaproute";

const snap = new Snaproute({
  baseUrl: "https://snap.yourdomain.com",
  edgeToken: process.env.EDGE_TOKEN,
});

// Shorten a URL
const short = await snap.shorten("https://example.com/very/long/url");
console.log(short.url); // https://snap.yourdomain.com/aB3xZ

// Retrieve analytics for a shortened link
const stats = await snap.analytics(short.id);
console.log(stats.clicks); // 142
console.log(stats.referrers); // { "google.com": 89, "twitter.com": 53 }
```

## Features

- ⚡ Runs on Edge functions for ultra-low latency redirects
- 📊 Built-in analytics dashboard with click tracking and referrer data
- 🔗 Custom slugs and expiring links
- 🌍 Geo and device breakdown per link

## Configuration

| Option | Type | Description |
|--------|------|-------------|
| `baseUrl` | `string` | Your hosted snaproute domain |
| `edgeToken` | `string` | API token for Edge function auth |
| `ttl` | `number` | Default link expiry in seconds (optional) |

## Development

```bash
git clone https://github.com/yourname/snaproute.git
cd snaproute
npm install
npm run dev
```

## License

MIT © 2024 snaproute contributors