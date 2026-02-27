import { GroupConfig } from './types';

// ✅ STRICT SINGLE SOURCE OF TRUTH
export const GROUPS: (GroupConfig & { center: { lat: number; lng: number } })[] = [
  {
    key: 'FULLDFIESTA',
    label: 'FIESTA',
    categories: ['Nightlife', 'Festivals', 'Concerts', 'Clubs'],
    center: { lat: 40.4168, lng: -3.7038 } // Madrid
  },
  {
    key: 'FULLDMOTOR',
    label: 'MOTOR',
    categories: ['Car Meets', 'Races', 'Exhibitions', 'Tuning'],
    center: { lat: 39.4699, lng: -0.3763 } // Valencia
  }
];

export const APP_NAVBAR_HEIGHT = '56px';
export const DEFAULT_COORDS = { lat: 40.4168, lng: -3.7038 }; // Madrid

export const SPAIN_PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
  'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'La Coruña',
  'Cuenca', 'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares',
  'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia',
  'Las Palmas', 'Pontevedra', 'La Rioja', 'Salamanca', 'Segovia', 'Sevilla', 'Soria', 'Tarragona',
  'Santa Cruz de Tenerife', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
];