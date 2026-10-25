# Billable Hours Tracker

CLI time tracker for freelancers. Track sessions, export invoice-ready JSON.

## The chain

```
node hours.js start "Client call"
node hours.js stop
node hours.js export 75        # $75/hr
node invoice.js --json invoice-data.json   # (Invoice Generator)
```

Track your hours → one command → invoice data. No copy-pasting timesheets.

## Commands
| Command | What it does |
|---|---|
| `start "Task"` | Start the timer |
| `stop` | Stop and log the session |
| `status` | Running timer + lifetime totals |
| `list` | All sessions |
| `export [rate]` | Write `invoice-data.json` (default $50/hr, or `$HOURLY_RATE` env var) |

## License
MIT

## Pairs with
**[Invoice Generator](https://github.com/moneyhoneypot98-star/invoice-generator)** — turn the exported JSON into a professional PDF-ready invoice in one command.
