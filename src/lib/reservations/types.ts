import type { ObjectId } from "mongodb";

/** Estados de la reserva en ciclo de vida operativo */
export type ReservationStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

/** Estado del cobro de seña / total (Mercado Pago) */
export type PaymentStatus = "not_required" | "pending" | "simulated_paid" | "approved" | "failed" | "refunded";

export type TreatmentCategory = "Láser" | "Facial" | "Corporal";

export type ReservationDoc = {
  _id: ObjectId;
  treatmentId: string;
  treatmentName: string;
  subtitle: string;
  category: TreatmentCategory;
  dateKey: string;
  timeLocal: string;
  displayDate: string;
  startsAt: Date;
  customerName: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  reservationStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
  source: "app_turnos";
  createdAt: Date;
  updatedAt: Date;
  /** Secreto de un solo uso para crear la preferencia Checkout Pro (no es password del usuario). */
  checkoutToken?: string;
  /** Igual a _id hex; también enviado a MP como external_reference. */
  externalReference?: string;
  preferenceId?: string | null;
  /** Último payment id de MP asociado (aprobado). */
  mpPaymentId?: string | null;
  /** Último status devuelto por la API de pagos (approved, pending, rejected, etc.). */
  mpPaymentStatusLast?: string | null;
  mpPaymentApprovedAt?: Date | null;
  paymentDeadlineAt?: Date | null;
  cancelReason?: string | null;
};

export type CreateReservationInput = {
  treatmentId: string;
  treatmentName: string;
  subtitle: string;
  category: TreatmentCategory;
  dateKey: string;
  timeLocal: string;
  displayDate: string;
  customerName: string;
  customerPhone: string;
  whatsappOptIn: boolean;
};

/** Auditoría de notificaciones Mercado Pago (webhook / IPN). */
export type MpWebhookEventDoc = {
  _id?: ObjectId;
  receivedAt: Date;
  method: string;
  topic: string | null;
  resourceId: string | null;
  querySnapshot: Record<string, string>;
  bodySnapshot: unknown;
  processingOutcome: "processed" | "ignored" | "error";
  detail?: string;
  reservationHexId?: string | null;
  mpPaymentId?: string | null;
};
