# Act Log

A minimalist desktop app that pops up every 25 minutes and asks: *what did you just do?*

Designed to break analysis paralysis and build self-awareness through simple, honest logging.

## How it works

1. Act Log runs quietly in your system tray
2. Every 25 minutes, a small popup appears
3. Type what you've been doing, hit Enter
4. That's it. Your activities are logged with timestamps.

## Features

- **Timed popup** - Gentle nudge every 25 minutes (configurable)
- **Log viewer** - Browse your history by date, with search
- **Themes** - 6 color themes, switch anytime
- **Bilingual** - English and Chinese, auto-detected
- **Lightweight** - Lives in the system tray, no main window

## Download

Go to [Releases](https://github.com/Ao-Last/act-log/releases) and download the latest `.dmg` file. Currently macOS (Apple Silicon) only.

## Data

Your logs are stored locally as a simple `.jsonl` file:

```
~/Library/Application Support/act-log/action_log.jsonl
```

Each line is a JSON object:

```json
{"timestamp":"2025-10-04T08:30:00.000Z","action":"Finished the draft"}
{"timestamp":"2025-10-04T09:00:00.000Z","action":"Fixed login page bug"}
```

Easy to parse with any tool you like.

## License

MIT
