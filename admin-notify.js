function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export async function onRequestPost({ request, env }) {
  if (!env.AAK_WEBHOOK_SECRET || !env.RESEND_API_KEY || !env.AAK_ADMIN_EMAIL || !env.AAK_FROM_EMAIL) {
    return json({ error: 'Notification service is not configured.' }, 503);
  }
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${env.AAK_WEBHOOK_SECRET}`) return json({ error: 'Unauthorized.' }, 401);
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return json({ error: 'Expected application/json.' }, 415);

  let payload;
  try {
    const raw = await request.text();
    if (raw.length > 30000) return json({ error: 'Payload too large.' }, 413);
    payload = JSON.parse(raw);
  } catch { return json({ error: 'Invalid JSON.' }, 400); }

  const table = payload?.table;
  const type = payload?.type;
  const record = payload?.record || {};
  const oldRecord = payload?.old_record || {};
  if (!['response_reports', 'response_feedback'].includes(table) || !['INSERT', 'UPDATE', 'DELETE'].includes(type)) {
    return json({ error: 'Unsupported database event.' }, 400);
  }
  // Only alert on new reports and new/changed feedback. Ignore feedback deletion events.
  if (type === 'DELETE' || (table === 'response_feedback' && type === 'UPDATE' && record.feedback === oldRecord.feedback)) {
    return json({ ok: true, skipped: true });
  }

  const isReport = table === 'response_reports';
  const subject = isReport ? `AAK AI: New response report #${record.id ?? ''}` : `AAK AI: Response feedback ${record.feedback === 'up' ? '👍' : '👎'}`;
  const details = isReport
    ? `<p><b>Type:</b> Response report</p><p><b>Report ID:</b> ${escapeHtml(record.id)}</p><p><b>User ID:</b> ${escapeHtml(record.user_id)}</p><p><b>Conversation:</b> ${escapeHtml(record.conversation_id || 'Not supplied')}</p><p><b>Message index:</b> ${escapeHtml(record.message_index)}</p><p><b>Reason:</b></p><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(record.reason)}</pre><p><b>Response excerpt:</b></p><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(record.response_excerpt || '')}</pre>`
    : `<p><b>Type:</b> Response feedback</p><p><b>Rating:</b> ${escapeHtml(record.feedback)}</p><p><b>User ID:</b> ${escapeHtml(record.user_id)}</p><p><b>Conversation:</b> ${escapeHtml(record.conversation_id)}</p><p><b>Message index:</b> ${escapeHtml(record.message_index)}</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.AAK_FROM_EMAIL,
      to: [env.AAK_ADMIN_EMAIL],
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#171717"><h2>AAK AI staff notification</h2>${details}<hr><p style="color:#666;font-size:12px">Automated notification from AAK AI. Review this item in the secured Supabase project.</p></div>`
    })
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    return json({ error: 'Email provider rejected the notification.', detail }, 502);
  }
  return json({ ok: true });
}
