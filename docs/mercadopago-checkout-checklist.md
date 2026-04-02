# Checklist manual — Mercado Pago Checkout Pro + reservas

1. **Variables**: `MONGODB_URI`, `MERCADOPAGO_ACCESS_TOKEN`, `APP_BASE_URL` (HTTPS público), `MERCADOPAGO_DEPOSIT_AMOUNT_ARS`, `PENDING_RESERVATION_TTL_MINUTES`, `CRON_SECRET`.

2. **Crear pendiente**: `POST /api/reservations/pending` con datos de turno válidos → respuesta con `id`, `checkoutToken`, `paymentDeadlineAt`; en Mongo la reserva debe quedar `pending_payment` y `paymentStatus: pending`.

3. **Preferencia**: `POST /api/mercadopago/preferences` con `reservationId` + `checkoutToken` → `init_point` y `preferenceId`; en documento debe guardarse `preferenceId`.

4. **Pago de prueba** (sandbox o producción según credenciales): completar checkout en MP; **no** confiar en la pantalla de retorno para el estado final.

5. **Webhook**: verificar en colección de auditoría que llegó el evento; la reserva debe pasar a `confirmed` y `paymentStatus: approved` solo si la API de pagos devolvió `approved` y el `external_reference` coincide.

6. **Idempotencia**: disparar de nuevo el mismo aviso (o esperar reintentos de MP) → la reserva sigue `confirmed` una sola vez, sin duplicar efectos.

7. **Pago rechazado / pendiente**: no debe confirmarse la reserva; `mpPaymentStatusLast` puede reflejar el estado consultado.

8. **Expiración**: tras vencer `paymentDeadlineAt`, `POST /api/cron/expire-reservations` con `Authorization: Bearer CRON_SECRET` → reserva `cancelled`; intentar pagar con token viejo debe fallar con 410.

9. **Panel**: en `/panel-turnos` las reservas deben mostrar campos MP (`preferenceId`, `mpPaymentId`, etc.) cuando existan.

Referencia oficial: [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing), [Preferencias](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/checkout-configuration/preferences), [Notificaciones](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks), [API de pagos](https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get).
