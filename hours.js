#!/usr/bin/env node
// Billable Hours Tracker — CLI time tracker that exports invoice-ready JSON
const fs = require('fs');
const path = require('path');

const STORE = path.join(process.cwd(), 'hours-store.json');

function load() {
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); }
  catch { return { entries: [] }; }
}
function save(db) { fs.writeFileSync(STORE, JSON.stringify(db, null, 2)); }

function fmtH(ms) { return (ms / 3600000).toFixed(2); }
function money(n) { return '$' + n.toFixed(2); }

const [cmd, ...rest] = process.argv.slice(2);
const db = load();

switch (cmd) {
  case 'start': {
    const desc = rest.join(' ') || 'Work session';
    if (db.entries.some(e => !e.end)) {
      console.error('ERROR: A timer is already running. Stop it first: hours stop');
      process.exit(1);
    }
    db.entries.push({ desc, start: Date.now(), end: null });
    save(db);
    console.log('▶ Tracking: "' + desc + '" (started ' + new Date().toLocaleTimeString() + ')');
    break;
  }
  case 'stop': {
    const open = db.entries.find(e => !e.end);
    if (!open) { console.error('ERROR: No running timer.'); process.exit(1); }
    open.end = Date.now();
    save(db);
    console.log('■ Stopped: "' + open.desc + '" — ' + fmtH(open.end - open.start) + ' hrs logged');
    break;
  }
  case 'status': {
    const open = db.entries.find(e => !e.end);
    if (open) {
      console.log('▶ Running: "' + open.desc + '" — ' + fmtH(Date.now() - open.start) + ' hrs so far');
    } else {
      console.log('No timer running.');
    }
    const total = db.entries.reduce((s, e) => s + (e.end ? e.end - e.start : 0), 0);
    console.log('Total tracked: ' + fmtH(total) + ' hrs across ' + db.entries.filter(e => e.end).length + ' sessions');
    break;
  }
  case 'list': {
    if (!db.entries.length) { console.log('No entries yet. Start one: hours start "Task"'); break; }
    console.log('DESCRIPTION                              HOURS');
    db.entries.forEach(e => {
      const h = e.end ? fmtH(e.end - e.start) : fmtH(Date.now() - e.start) + ' (running)';
      console.log(e.desc.padEnd(40) + String(h).padStart(6));
    });
    break;
  }
  case 'export': {
    const rate = parseFloat(rest[0]) || parseFloat(process.env.HOURLY_RATE) || 50;
    const project = process.env.PROJECT_NAME || 'Client Work';
    const closed = db.entries.filter(e => e.end);
    if (!closed.length) { console.error('ERROR: No completed sessions to export.'); process.exit(1); }
    const items = closed.map(e => ({
      desc: e.desc + ' (' + fmtH(e.end - e.start) + ' hrs @ ' + money(rate) + '/hr)',
      qty: parseFloat(fmtH(e.end - e.start)),
      rate: rate
    }));
    const out = { company: 'YOUR NAME', companyAddr: 'Your Address', companyEmail: 'you@example.com', clientName: 'CLIENT NAME', clientAddr: '', clientEmail: '', invoiceNum: 'INV-' + Date.now().toString().slice(-6), items, taxRate: 0 };
    fs.writeFileSync('invoice-data.json', JSON.stringify(out, null, 2));
    const hours = items.reduce((s, i) => s + i.qty, 0);
    console.log('✓ Exported invoice-data.json — ' + hours + ' hrs @ ' + money(rate) + '/hr = ' + money(hours * rate) + ' before tax');
    console.log('Next: edit names in invoice-data.json, then: node invoice.js --json invoice-data.json');
    break;
  }
  default:
    console.log(`Billable Hours Tracker

Usage:
  node hours.js start "Task description"   Start the timer
  node hours.js stop                       Stop and log the session
  node hours.js status                     Show running timer + totals
  node hours.js list                       List all sessions
  node hours.js export [HOURLY_RATE]       Export invoice-ready JSON (default $50/hr, or \$HOURLY_RATE)

Works with the Invoice Generator: export -> node invoice.js --json invoice-data.json`);
}
