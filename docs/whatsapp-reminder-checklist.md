# Checklist manual — recordatorio WhatsApp 24h

1. **Meta Business**: número de WhatsApp conectado a la app, plantilla de mensaje **aprobada** con variables en el body en este orden: `{{1}}` nombre, `{{2}}` tratamiento, `{{3}}` fecha, `{{4}}` hora. Si usás un quinto parámetro, definí `WHATSAPP_TEMPLATE_BODY_PARAM_5` y agregá `{{5}}` en la plantilla.

2. **Variables Vercel / servidor**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`, `WHATSAPP_REMINDER_WINDOW_MINUTES` (opcional, default 15), `CRON_SECRET`, `MONGODB_URI`.

3. **Cron**: programar `POST https://<tu-dominio>/api/cron/whatsapp-reminder` con cabecera `Authorization: Bearer <CRON_SECRET>` cada 5–15 minutos (debe entrar varias veces en la ventana de 24h±).

4. **Candidata**: reserva `confirmed`, `whatsappOptIn: true`, `startsAt` dentro de `now + 24h ± ventana`, sin `waReminder24hSentAt`.

5. **Prueba**: ajustar en Mongo una reserva de prueba con `startsAt` en la ventana; ejecutar el cron manualmente → `sentCount: 1` y en el documento `waReminder24hStatus: sent`.

6. **Idempotencia**: repetir el mismo POST → `sentCount: 0`, `scannedCount` puede ser 0 o la misma reserva ya no califica.

7. **Teléfono inválido**: debe incrementar `skippedCount` y marcar `waReminder24hStatus: skipped`.

8. **Panel**: `GET /api/panel-turnos/reservations` debe exponer `waReminder24h*` para soporte.

Referencia: [WhatsApp Cloud API — template messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#template-messages).
