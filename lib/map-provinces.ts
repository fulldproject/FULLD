export interface ProvinceCentroid {
    lat: number;
    lng: number;
    name: string;
}

// Centroids for major Spanish provinces (Demo)
export const PROVINCE_CENTROIDS: Record<string, ProvinceCentroid> = {
    // Common variations used as keys
    madrid: { lat: 40.4168, lng: -3.7038, name: "Madrid" },
    barcelona: { lat: 41.3851, lng: 2.1734, name: "Barcelona" },
    valencia: { lat: 39.4699, lng: -0.3763, name: "Valencia" },
    sevilla: { lat: 37.3891, lng: -5.9845, name: "Sevilla" },
    zaragoza: { lat: 41.6488, lng: -0.8891, name: "Zaragoza" },
    malaga: { lat: 36.7212, lng: -4.4217, name: "Málaga" },
    murcia: { lat: 37.9922, lng: -1.1307, name: "Murcia" },
    palma: { lat: 39.5696, lng: 2.6502, name: "Mallorca" },
    bilbao: { lat: 43.263, lng: -2.935, name: "Bizkaia" },
    alicante: { lat: 38.3452, lng: -0.481, name: "Alicante" },
    // Add more as needed
};

// Fallback for unknown provinces (maps to center of Spain or discards)
export const UNKNOWN_PROVINCE: ProvinceCentroid = {
    lat: 40.0,
    lng: -4.0,
    name: "Other",
};

export const normalizeProvince = (p?: string): string => {
    if (!p) return "other";
    return p.trim().toLowerCase();
};
