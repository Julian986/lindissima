# Flujo de recordatorios (Mongo → Cron → WhatsApp) y `vercel.json`

Documento para **entender y corregir** el modelo mental: qué hace el sistema hoy y cómo encaja Vercel Cron.

---

## 1. Diagrama conceptual (versión correcta)

```
MongoDB (reservas / turnos guardados)
        ↓
Cron de Vercel (ejecuta automáticamente según horario)
        ↓
GET /api/cron/daily  (Vercel envía Authorization: Bearer CRON_SECRET)
        ↓
El servidor busca candidatos: turnos del DÍA SIGUIENTE en Argentina
        (calendario America/Argentina/Buenos_Aires), confirmados,
        con whatsappOptIn, sin recordatorio ya marcado
        ↓
Twilio (WhatsApp con plantilla aprobada) o Meta Cloud API
        ↓
Mensaje al cliente; se guarda waReminder24hSentAt (idempotencia)
```

### Qué estaba mal en la versión “24 h”

- **No** se eligen turnos por “estar a 24 horas del `startsAt` en el instante del cron”.
- **Sí** se eligen turnos cuya **fecha del turno es mañana** en Argentina (`dateKey` = YYYY-MM-DD de mañana en esa zona), más filtros de negocio (`confirmed`, opt-in, no enviado).
- Eso encaja bien con **un cron diario**: cada mañana (hora que elijas en UTC) avisás a quien tiene turno **el día siguiente** en el calendario local del negocio.

El nombre del campo `waReminder24hSentAt` es **histórico** (“recordatorio tipo 24 h antes”); hoy significa “ya se envió el recordatorio de víspera”.

---

## 2. Qué es y cómo funciona `vercel.json` (bloque `crons`)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 13 * * *"
    }
  ]
}
```

| Parte | Significado |
|--------|-------------|
| **`crons`** | Lista de trabajos programados que **Vercel** ejecuta contra tu despliegue de **producción** (no Preview). |
| **`path`** | Ruta HTTP que Vercel **llama** en tu app. Aquí es `GET /api/cron/daily` (en Next.js App Router suele mapear a `src/app/api/cron/daily/route.ts`). |
| **`schedule`** | Expresión **cron en UTC**: `minuto hora día-del-mes mes día-de-semana`. |

### Lectura de `0 13 * * *`

- **Minuto 0, hora 13** → todos los días a las **13:00 UTC**.
- En Argentina (UTC−3 estándar) eso es aproximadamente **10:00** hora local el mismo día calendario (sin considerar DST si cambia; el cron sigue siendo UTC).

### Límites del plan Hobby

- En **Hobby**, Vercel permite **como máximo un cron por día**; si ponés algo más frecuente, el deploy puede fallar.
- La ejecución puede **demorarse un poco** dentro de esa ventana; no asumas minuto exacto.

### Seguridad

- Si definís **`CRON_SECRET`** en las variables de entorno del proyecto, Vercel envía `Authorization: Bearer <CRON_SECRET>` al disparar el cron. Tu ruta debe validar ese header (como hace `verify-secret` en este repo).

---

## 3. Qué hace exactamente `/api/cron/daily`

En este proyecto, en un solo disparo suele ejecutarse (en orden lógico):

1. **Expirar** reservas pendientes de pago vencidas.
2. **Recordatorios WhatsApp** (si Twilio o Meta están configurados).

Para probar a mano (igual que Vercel):

```bash
curl -s -H "Authorization: Bearer TU_CRON_SECRET" \
  "https://TU-DOMINIO.vercel.app/api/cron/daily"
```

---

## 4. Dónde está en el código

- Candidatos a recordatorio: `findReservationsNeedingReminderNextDayAr` en `src/lib/reservations/admin-queries.ts`.
- Envío y marca de envío: `src/lib/whatsapp/run-reminders.ts`.
- Ruta del cron: `src/app/api/cron/daily/route.ts`.
- Definición del cron: `vercel.json` en la raíz del repo.

Guía operativa Twilio + variables: `docs/twilio-y-vercel-cron.md`.
