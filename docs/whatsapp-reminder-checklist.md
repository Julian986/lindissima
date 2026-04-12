# Checklist manual — recordatorio WhatsApp 24h

1. **Proveedor**: **Meta** (Cloud API) o **Twilio** (número virtual). Twilio: ver `docs/twilio-y-vercel-cron.md`. Variable `WHATSAPP_PROVIDER=meta|twilio` si tenés ambos configurados; si solo Twilio está completo, se elige Twilio automáticamente.

2. **Meta Business**: plantilla **aprobada** con `{{1}}` nombre, `{{2}}` tratamiento, `{{3}}` fecha, `{{4}}` hora. Quinto parámetro: `WHATSAPP_TEMPLATE_BODY_PARAM_5` + `{{5}}`.

3. **Variables servidor**: Meta → `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`. Twilio → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_REMINDER_CONTENT_SID`. Común: `WHATSAPP_REMINDER_WINDOW_MINUTES` (opcional), `CRON_SECRET`, `MONGODB_URI`.

4. **Cron Vercel (Hobby)**: una vez al día — `GET /api/cron/daily` (ver `vercel.json`; hora en UTC, default ≈ 10:00 Argentina). Incluye expiración de pendientes + recordatorios. Con cron diario, subí **`WHATSAPP_REMINDER_WINDOW_MINUTES`** (ej. **720**). Para pruebas: mismo `Authorization` en `/api/cron/whatsapp-reminder` o `/api/cron/expire-reservations`.

5. **Candidata**: reserva `confirmed`, `whatsappOptIn: true`, `startsAt` dentro de `now + 24h ± ventana`, sin `waReminder24hSentAt`.

6. **Prueba**: ajustar en Mongo una reserva de prueba con `startsAt` en la ventana; ejecutar el cron manualmente → `sentCount: 1` y en el documento `waReminder24hStatus: sent`.

7. **Idempotencia**: repetir el mismo POST → `sentCount: 0`, `scannedCount` puede ser 0 o la misma reserva ya no califica.

8. **Teléfono inválido**: debe incrementar `skippedCount` y marcar `waReminder24hStatus: skipped`.

9. **Panel**: `GET /api/panel-turnos/reservations` debe exponer `waReminder24h*` para soporte.

Referencia: [WhatsApp Cloud API — template messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#template-messages).
