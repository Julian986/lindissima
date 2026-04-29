# Twilio WhatsApp + Vercel Cron (recordatorios víspera)

Guía para dejar funcionando recordatorios con **número virtual Twilio** y disparos automáticos en **Vercel**.

## 1. Twilio: cuenta y WhatsApp

1. Creá cuenta en [https://www.twilio.com](https://www.twilio.com).
2. En la [Consola](https://console.twilio.com/), anotá **Account SID** y **Auth Token** (Account → API keys & tokens).
3. **WhatsApp**: 
   - **Sandbox** (pruebas): unís tu WhatsApp personal con el código que muestra Twilio; solo podés enviar a números que se unieron.
   - **Producción**: solicitá un número de WhatsApp con Twilio (flujo “WhatsApp Sender” / aprobación según país). Sin sandbox, los clientes no tienen que “unirse”.

## 2. Plantilla de mensaje (obligatoria)

Los recordatorios son mensajes **iniciados por la empresa**: WhatsApp exige **plantilla aprobada**.

1. En Twilio: **Messaging → Content** (o la ruta actual para *Content Template* / plantillas WhatsApp).
2. Creá un contenido tipo plantilla con **cuatro variables** en el cuerpo, en este orden:
   - `{{1}}` — nombre del cliente  
   - `{{2}}` — tratamiento  
   - `{{3}}` — fecha (texto mostrado)  
   - `{{4}}` — hora local  
3. Opcional: quinta variable `{{5}}` (texto fijo desde env `TWILIO_TEMPLATE_BODY_PARAM_5`, igual que en Meta).
4. Enviá la plantilla a **aprobación de WhatsApp** y esperá el estado *Approved*.
5. Copiá el **Content SID** (suele empezar por `HX...`) → variable `TWILIO_REMINDER_CONTENT_SID`.

> Las variables deben coincidir con el orden que envía el código (`ContentVariables` JSON con claves `"1"` … `"4"`).

## 3. Número de envío (`From`)

Valor de **`TWILIO_WHATSAPP_FROM`** (ejemplos):

- Sandbox: algo como `whatsapp:+14155238886` (el que indica Twilio en la doc del sandbox).
- Producción: el número WhatsApp que Twilio te asignó, formato `whatsapp:+549...` o solo `+549...` (el código normaliza).

## 4. Variables en Vercel (Producción)

Definí en el proyecto → **Settings → Environment Variables**:

| Variable | Descripción |
|----------|-------------|
| `CRON_SECRET` | Cadena larga aleatoria (ej. `openssl rand -hex 32`). Vercel la manda en `Authorization: Bearer …` al ejecutar el cron. |
| `WHATSAPP_PROVIDER` | `twilio` (recomendado si solo usás Twilio). Si no existe y Twilio está completo, el código también elige Twilio automáticamente. |
| `TWILIO_ACCOUNT_SID` | Account SID |
| `TWILIO_AUTH_TOKEN` | Auth Token |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+…` o `+…` |
| `TWILIO_REMINDER_CONTENT_SID` | `HX…` de la plantilla aprobada |
| `MONGODB_URI` | Ya la tenés para la app |

> `WHATSAPP_REMINDER_WINDOW_MINUTES` existía para la lógica antigua (ventana alrededor de “24 h antes” respecto del instante del job). **La selección actual de candidatos usa el día siguiente en Argentina** (`findReservationsNeedingReminderNextDayAr`); esa variable **no aplica** a esa query. Podés dejarla en `.env` por compatibilidad o quitarla.

**No** uses prefijo `NEXT_PUBLIC_` en secretos de Twilio.

Tras guardar: **Redeploy** del proyecto.

## 5. Vercel Cron (plan Hobby = una vez al día)

En el **plan gratuito (Hobby)**, Vercel solo permite cron jobs que corran **como máximo una vez por día**; expresiones más frecuentes **fallan al desplegar**.

Este repo usa **un solo cron** en `vercel.json`:

- Ruta: `GET /api/cron/daily`
- Hora: **`0 13 * * *`** → todos los días a las **13:00 UTC** (≈ **10:00** en Argentina, UTC−3 sin horario de verano).
- Ese endpoint hace en orden: **expirar** reservas `pending_payment` vencidas y **recordatorios WhatsApp** (si está configurado).

Si necesitás otra zona horaria, cambiá el primer campo de minutos/hora en el cron (siempre en **UTC**). En Hobby la ejecución puede caer en cualquier momento **dentro de esa hora** (no es al minuto exacto).

### Criterio de candidatos con cron diario

La query busca reservas cuya **fecha del turno es mañana** en **`America/Argentina/Buenos_Aires`** (`dateKey`), estado `confirmed`, `whatsappOptIn: true`, sin `waReminder24hSentAt`. Así un único disparo diario cubre todos los turnos del día siguiente en el calendario del negocio, sin depender de “exactamente 24 h antes” del `startsAt`.

Las rutas `/api/cron/whatsapp-reminder` y `/api/cron/expire-reservations` siguen existiendo para **pruebas manuales** (GET/POST con `Authorization: Bearer CRON_SECRET`).

Requisitos:

- Variable **`CRON_SECRET`** en Vercel (Vercel envía `Authorization: Bearer …` al cron).

Tras el deploy: **Settings → Cron Jobs** → debería listarse `/api/cron/daily`.

## 6. Prueba manual (sin esperar al cron)

Tarea diaria completa (igual que Vercel):

```bash
curl -s -H "Authorization: Bearer TU_CRON_SECRET" \
  "https://TU-DOMINIO.vercel.app/api/cron/daily"
```

Solo recordatorios o solo expiración (opcional):

```bash
curl -s -H "Authorization: Bearer TU_CRON_SECRET" \
  "https://TU-DOMINIO.vercel.app/api/cron/whatsapp-reminder"
curl -s -H "Authorization: Bearer TU_CRON_SECRET" \
  "https://TU-DOMINIO.vercel.app/api/cron/expire-reservations"
```

## 7. Candidatos a recordatorio (Mongo)

Igual que con Meta: reserva `confirmed`, `whatsappOptIn: true`, **`dateKey` = mañana en Argentina**, sin `waReminder24hSentAt`. Ver flujo detallado en `docs/recordatorios-flujo-y-cron.md`.

## 8. Meta en lugar de Twilio

Si `WHATSAPP_PROVIDER=meta` (o no configurás Twilio y sí las variables `WHATSAPP_*`), el job usa la Cloud API de Meta. Ver `docs/whatsapp-reminder-checklist.md`.

## 9. Números argentinos

Si el cliente carga 10 dígitos sin país (ej. área + móvil), el código antepone `549`. Si ya viene con `54`, se usa tal cual. Otros países: que el número venga con **código de país** en dígitos.
