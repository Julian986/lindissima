import type { ObjectId } from "mongodb";

/** Estados de la reserva en ciclo de vida operativo */
export type ReservationStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

/** Estado del cobro de seña (Mercado Pago u otro) */
export type PaymentStatus = "not_required" | "pending" | "simulated_paid" | "approved" | "failed" | "refunded";

export type ReservationDoc = {
  _id: ObjectId;
  treatmentId: string;
  treatmentName: string;
  subtitle: string;
  category: TreatmentCategory;
  /** YYYY-MM-DD en calendario de la clínica */
  dateKey: string;
  /** HH:mm en horario local AR */
  timeLocal: string;
  /** Texto legible enviado por el cliente (ej. "Domingo, 30 mar") */
  displayDate: string;
  /** Inicio del turno en UTC derivado de dateKey + timeLocal (Argentina) */
  startsAt: Date;
  customerName: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  reservationStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
  source: "app_turnos";
  createdAt: Date;
  updatedAt: Date;
};

export type TreatmentCategory = "Láser" | "Facial" | "Corporal";

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
