import { EventGeneral, Edition, StatusModeration } from '../types';

export const mockEvents: EventGeneral[] = [
  {
    id: 'e16f1c4e-1234-4a5b-9c8d-7e6f5a4b3c2d',
    name: 'Neon Nights Festival',
    group_key: 'FULLDFIESTA',
    category: 'Festivals',
    lat: 41.3851,
    lng: 2.1734,
    city: 'Barcelona',
    province: 'Barcelona',
    community: 'Catalonia',
    short_description: 'The most vibrant electronic music festival on the coast.',
    status_moderation: StatusModeration.APPROVED,
    created_by: 'u1',
    created_at: '2023-12-01T10:00:00Z',
    image_url: 'https://picsum.photos/seed/fiesta1/800/600'
  },
  {
    id: 'e27g2d5f-2345-5b6c-0d9e-8f7g6h5i4j3k',
    name: 'Drift Masters Finals',
    group_key: 'FULLDMOTOR',
    category: 'Races',
    lat: 40.6022,
    lng: -3.5855,
    city: 'San Sebastián de los Reyes',
    province: 'Madrid',
    community: 'Community of Madrid',
    short_description: 'Extreme drifting competition at the legendary Jarama Circuit.',
    status_moderation: StatusModeration.APPROVED,
    created_by: 'u1',
    created_at: '2023-11-15T12:00:00Z',
    image_url: 'https://picsum.photos/seed/motor1/800/600'
  },
  {
    id: 'e38h3e6g-3456-6c7d-1e0f-9g8h7i6j5k4l',
    name: 'Concrete Jungle Skate',
    group_key: 'FULLDURBAN',
    category: 'Skate',
    lat: 41.3784,
    lng: 2.1915,
    city: 'Barcelona',
    province: 'Barcelona',
    community: 'Catalonia',
    short_description: 'Street skate competition for all levels.',
    status_moderation: StatusModeration.APPROVED,
    created_by: 'u2',
    created_at: '2024-01-10T09:00:00Z',
    image_url: 'https://picsum.photos/seed/skate1/800/600'
  },
  {
    id: 'e49i4f7h-4567-7d8e-2f1g-0h9i8j7k6l5m',
    name: 'Street Battle Royale (PENDING)',
    group_key: 'FULLDFREESTYLE',
    category: 'Battles',
    lat: 40.4531,
    lng: -3.6883,
    city: 'Madrid',
    province: 'Madrid',
    community: 'Community of Madrid',
    short_description: 'The ultimate rap battle showcase. Currently waiting for approval.',
    status_moderation: StatusModeration.PENDING,
    created_by: 'u1',
    created_at: '2024-02-01T14:30:00Z',
    image_url: 'https://picsum.photos/seed/rap1/800/600'
  },
  {
    id: 'e50j5g8i-5678-8e9f-3g2h-1i0j9k8l7m6n',
    name: 'Underground Cypher Session (REJECTED)',
    group_key: 'FULLDFREESTYLE',
    category: 'Cyphers',
    lat: 37.3891,
    lng: -5.9845,
    city: 'Sevilla',
    province: 'Sevilla',
    community: 'Andalusia',
    short_description: 'This event was rejected due to missing location details.',
    status_moderation: StatusModeration.REJECTED,
    created_by: 'u3',
    created_at: '2024-03-05T18:00:00Z',
    image_url: 'https://picsum.photos/seed/cypher1/800/600'
  },
  {
    id: 'e61k6h9j-6789-9f0a-4h3i-2j1k0l9m8n7o',
    name: 'BMX Urban Jam (ARCHIVED)',
    group_key: 'FULLDURBAN',
    category: 'BMX',
    lat: 39.4699,
    lng: -0.3763,
    city: 'Valencia',
    province: 'Valencia',
    community: 'Valencian Community',
    short_description: 'Old competition held last year. Archived for record keeping.',
    status_moderation: StatusModeration.ARCHIVED,
    created_by: 'u2',
    created_at: '2024-03-10T10:00:00Z',
    image_url: 'https://picsum.photos/seed/bmx1/800/600'
  }
];

export const mockEditions: Edition[] = [
  {
    id: 'ed1',
    event_id: 'e16f1c4e-1234-4a5b-9c8d-7e6f5a4b3c2d',
    date_mode: 'date',
    date_start: '2024-08-15',
    date_end: '2024-08-17',
    date_text: '15 - 17 August 2024'
  },
  {
    id: 'ed2',
    event_id: 'e27g2d5f-2345-5b6c-0d9e-8f7g6h5i4j3k',
    date_mode: 'text',
    date_text: 'Coming this Autumn'
  },
  {
    id: 'ed3',
    event_id: 'e38h3e6g-3456-6c7d-1e0f-9g8h7i6j5k4l',
    date_mode: 'date',
    date_start: '2024-07-20',
    date_text: '20 July 2024'
  },
  {
    id: 'ed4',
    event_id: 'e49i4f7h-4567-7d8e-2f1g-0h9i8j7k6l5m',
    date_mode: 'date',
    date_start: '2024-05-12',
    date_text: '12 May 2024'
  },
  {
    id: 'ed5',
    event_id: 'e50j5g8i-5678-8e9f-3g2h-1i0j9k8l7m6n',
    date_mode: 'text',
    date_text: 'Every First Friday'
  },
  {
    id: 'ed6',
    event_id: 'e61k6h9j-6789-9f0a-4h3i-2j1k0l9m8n7o',
    date_mode: 'date',
    date_start: '2024-06-22',
    date_text: '22 June 2024'
  }
];