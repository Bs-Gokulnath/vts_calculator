export function formatRupees(v: number): string {
  const [int, dec] = v.toFixed(2).split('.');
  let result = '';
  const len = int.length;
  for (let i = 0; i < len; i++) {
    if (i > 0) {
      const fromRight = len - i;
      if (fromRight === 3 || (fromRight > 3 && (fromRight - 3) % 2 === 0)) result += ',';
    }
    result += int[i];
  }
  return `₹${result}.${dec}`;
}

export function formatDate(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Email HTML builder ───────────────────────────────────────────────────────

export function buildEmailHtml(text: string): string {
  const isSep = (l: string) => l.includes('──');
  const lines  = text.split('\n');

  // Header + optional end-use (lines before first separator)
  let header = '';
  let endUse = '';
  let i = 0;
  for (; i < lines.length; i++) {
    const l = lines[i].trim();
    if (isSep(lines[i])) { i++; break; }
    if (!l) continue;
    if (l.startsWith('End use:')) endUse = l.replace('End use:', '').trim();
    else header = l;
  }

  // Collect all key:value pairs in order
  const kv: { key: string; value: string }[] = [];
  for (; i < lines.length; i++) {
    if (isSep(lines[i]) || !lines[i].trim()) continue;
    const ci = lines[i].indexOf(':');
    if (ci > -1) kv.push({ key: lines[i].substring(0, ci).trim(), value: lines[i].substring(ci + 1).trim() });
  }

  // Last "Yarn Rate" entry is the final calculated rate — separate it out
  const yrIdxs = kv.map((r, j) => r.key === 'Yarn Rate' ? j : -1).filter(j => j > -1);
  const finalRate = yrIdxs.length > 0 ? kv[yrIdxs[yrIdxs.length - 1]].value : null;
  const baseKv    = yrIdxs.length > 0 ? kv.filter((_, j) => j !== yrIdxs[yrIdxs.length - 1]) : kv;

  // Buckets
  const productionKeys  = new Set(['Count', 'GPS', 'Production', 'Doubling Rate']);
  const pricingKeys     = new Set(['Yarn Rate', 'Inc. Transport', 'Waste']);
  const production      = baseKv.filter(r => productionKeys.has(r.key));
  const pricing         = baseKv.filter(r => pricingKeys.has(r.key));
  const cleanFibre      = baseKv.find(r => r.key === 'Clean Fibre Price');
  const ratePerKg       = baseKv.find(r => r.key === 'Rate / kg');

  // ── HTML helpers ──
  const td = (label: string, value: string, bold = false, color = '#1f2937') =>
    `<tr>
       <td style="padding:9px 20px;font-size:13px;color:#6b7280;font-family:Arial,sans-serif;border-bottom:1px solid #f3f0fb;">${label}</td>
       <td style="padding:9px 20px;font-size:13px;color:${color};font-weight:${bold ? '700' : '500'};text-align:right;font-family:Arial,sans-serif;border-bottom:1px solid #f3f0fb;">${value}</td>
     </tr>`;

  const sectionLabel = (label: string) =>
    `<tr>
       <td colspan="2" style="padding:12px 20px 4px;font-size:10px;font-weight:700;color:#a78bfa;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,sans-serif;">${label}</td>
     </tr>`;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;border:1px solid #ede9fe;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="background:linear-gradient(135deg,#7C3AED 0%,#8B5CF6 100%);padding:22px 24px;">
      <div style="color:#ffffff;font-size:20px;font-weight:700;font-family:Arial,sans-serif;">${header}</div>
      ${endUse ? `<div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:3px;font-family:Arial,sans-serif;">End use: ${endUse}</div>` : ''}
      <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:6px;font-family:Arial,sans-serif;">VT Sons — Yarn Price Quote</div>
    </td>
  </tr>

  ${production.length ? `
  <tr><td style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${sectionLabel('Production')}
      ${production.map(r => td(r.key, r.value)).join('')}
    </table>
  </td></tr>` : ''}

  ${pricing.length ? `
  <tr><td style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${sectionLabel('Pricing')}
      ${pricing.map(r => td(r.key, r.value)).join('')}
    </table>
  </td></tr>` : ''}

  ${cleanFibre ? `
  <tr>
    <td style="padding:12px 16px 4px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:8px;">
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:#7c3aed;font-family:Arial,sans-serif;">Clean Fibre Price</td>
          <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#7c3aed;text-align:right;font-family:Arial,sans-serif;">${cleanFibre.value}</td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  ${ratePerKg ? `
  <tr><td style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${sectionLabel('Calculation')}
      ${td(ratePerKg.key, ratePerKg.value)}
    </table>
  </td></tr>` : ''}

  ${finalRate ? `
  <tr>
    <td style="padding:12px 16px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#7C3AED 0%,#8B5CF6 100%);border-radius:10px;">
        <tr>
          <td style="padding:18px 20px;text-align:center;">
            <div style="color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;">Final Yarn Rate</div>
            <div style="color:#ffffff;font-size:28px;font-weight:800;font-family:Arial,sans-serif;">${finalRate}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <tr>
    <td style="padding:10px 24px 12px;text-align:center;background:#faf9ff;border-top:1px solid #ede9fe;">
      <span style="color:#c4b5fd;font-size:11px;font-family:Arial,sans-serif;">Generated by VT Sons</span>
    </td>
  </tr>
</table>`;
}

// ── Mailto URL ───────────────────────────────────────────────────────────────

export function buildMailtoUrl(text: string): string {
  const firstLine = text.split('\n').find(l => l.trim() && !l.includes('──')) ?? 'Yarn Quote';
  const subject   = `Yarn Price Quote — ${firstLine.trim()}`;
  const body      = text.replace(/──+/g, '─────────').trimEnd()
                    + '\n\nGenerated by VT Sons';
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── Share ────────────────────────────────────────────────────────────────────

export async function shareText(text: string): Promise<void> {
  try {
    const html = buildEmailHtml(text);
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html':  new Blob([html],  { type: 'text/html'  }),
        'text/plain': new Blob([text],  { type: 'text/plain' }),
      }),
    ]);
  } catch {
    // ClipboardItem not supported — fall back to plain text
    await navigator.clipboard.writeText(text);
  }
}
