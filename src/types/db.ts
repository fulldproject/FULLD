export type GroupKey = "FULLDFIESTA" | "FULLDMOTOR" | "FULLDFREESTYLE";

export type EventoTipo = "FIJO" | "ITINERANTE";

export type DateModeDB = "DATE" | "TEXT" | "NONE";

export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EventoGeneralRow {
    id: string;
    nombre: string;
    grupo: GroupKey;
    categoria: string;
    tipo: EventoTipo;
    municipio: string | null;
    provincia: string | null;
    comunidad: string | null;
    estado_moderacion: ModerationStatus;
    creado_por: string | null;
    created_at: string;
    updated_at: string;
}

export interface EventoGeneralInsert {
    nombre: string;
    grupo: GroupKey;
    categoria: string;
    tipo: EventoTipo;
    lng: number;
    lat: number;
    municipio?: string | null;
    provincia?: string | null;
    comunidad?: string | null;
}

export interface EdicionRow {
    id: string;
    evento_id: string;
    nombre_edicion: string | null;
    date_mode: DateModeDB;
    date_start: string | null;
    date_end: string | null;
    date_text: string | null;
    cartel_url: string | null;
    descripcion: string | null;
    created_at: string;
    updated_at: string;
}

export interface EdicionInsert {
    evento_id: string;
    date_mode: DateModeDB;
    date_start?: string | null;
    date_end?: string | null;
    date_text?: string | null;
    cartel_url?: string | null;
    descripcion?: string | null;
}
