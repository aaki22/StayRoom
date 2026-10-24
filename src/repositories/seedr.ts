import 'dotenv/config';
import * as argon2 from 'argon2';
import {
  BOOKING,
  SYSTEM_ACTOR_ID,
} from '../constants/constants.ts';
import { loadSettings } from '../settings.ts';
import { createLogger } from '../utils/logger.ts';
import { DatabaseClient } from './database.ts';

const SEED_IDS = Object.freeze({
  ADMIN_ACTOR_ID: '00000000-0000-4000-8000-000000000002',
  CUSTOMER_ACTOR_ID: '00000000-0000-4000-8000-000000000003',
  ADMIN_USER_ID: '00000000-0000-4000-8000-000000000011',
  CUSTOMER_USER_ID: '00000000-0000-4000-8000-000000000012',
  RTM_STANDARD_ID: '00000000-0000-4000-8000-000000000101',
  RTM_DELUXE_ID: '00000000-0000-4000-8000-000000000102',
  RTM_SUITE_ID: '00000000-0000-4000-8000-000000000103',
  RTM_FAMILY_ID: '00000000-0000-4000-8000-000000000104',
  HOTEL_BLR_ID: '00000000-0000-4000-8000-000000000201',
  HOTEL_BOM_ID: '00000000-0000-4000-8000-000000000202',
  HRT_BLR_DELUXE_ID: '00000000-0000-4000-8000-000000000301',
  HRT_BLR_SUITE_ID: '00000000-0000-4000-8000-000000000302',
  HRT_BOM_STANDARD_ID: '00000000-0000-4000-8000-000000000303',
  HRT_BOM_SUITE_ID: '00000000-0000-4000-8000-000000000304',
  ROOM_BLR_101_ID: '00000000-0000-4000-8000-000000000401',
  ROOM_BLR_102_ID: '00000000-0000-4000-8000-000000000402',
  ROOM_BLR_201_ID: '00000000-0000-4000-8000-000000000403',
  ROOM_BOM_101_ID: '00000000-0000-4000-8000-000000000404',
  ROOM_BOM_102_ID: '00000000-0000-4000-8000-000000000405',
  ROOM_BOM_301_ID: '00000000-0000-4000-8000-000000000406',
});

async function runSeed(): Promise<void> {
  const settings = loadSettings();
  const logger = createLogger(settings);
  const db = new DatabaseClient(settings, logger);

  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    argon2.hash('StayRoomAdmin@2026', {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    }),
    argon2.hash('StayRoomGuest@2026', {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    }),
  ]);

  const checkInTime = new Date('1970-01-01T14:00:00.000Z');
  const checkOutTime = new Date('1970-01-01T11:00:00.000Z');

  await db.connect();

  try {
    await db.transaction(async (tx) => {
      await tx.auditActor.createMany({
        skipDuplicates: true,
        data: [
          {
            id: SYSTEM_ACTOR_ID,
            actor_type: 'SYSTEM',
            actor_name: 'system',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.ADMIN_ACTOR_ID,
            actor_type: 'ADMIN',
            actor_name: 'StayRoom Platform Admin',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.CUSTOMER_ACTOR_ID,
            actor_type: 'USER',
            actor_name: 'Aarav Mehta',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
        ],
      });

      await tx.user.createMany({
        skipDuplicates: true,
        data: [
          {
            id: SEED_IDS.ADMIN_USER_ID,
            audit_actor_id: SEED_IDS.ADMIN_ACTOR_ID,
            name: 'StayRoom Platform Admin',
            email: 'admin@stayroom.in',
            phone: '+919876543210',
            password_hash: adminPasswordHash,
            role: 'ADMIN',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.CUSTOMER_USER_ID,
            audit_actor_id: SEED_IDS.CUSTOMER_ACTOR_ID,
            name: 'Aarav Mehta',
            email: 'customer@stayroom.in',
            phone: '+919876543211',
            password_hash: customerPasswordHash,
            role: 'CUSTOMER',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
        ],
      });

      await tx.roomTypeMaster.createMany({
        skipDuplicates: true,
        data: [
          {
            id: SEED_IDS.RTM_STANDARD_ID,
            code: 'STANDARD',
            name: 'Standard',
            description: 'Quiet queen room crafted for restful city stays.',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.RTM_DELUXE_ID,
            code: 'DELUXE',
            name: 'Deluxe',
            description: 'Spacious king room with courtyard views and lounge seating.',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.RTM_SUITE_ID,
            code: 'SUITE',
            name: 'Suite',
            description: 'Corner residence with separate living room and soaking bath.',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.RTM_FAMILY_ID,
            code: 'FAMILY',
            name: 'Family',
            description: 'Interconnected two-bedroom sanctuary for up to four guests.',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
        ],
      });

      await tx.hotel.createMany({
        skipDuplicates: true,
        data: [
          {
            id: SEED_IDS.HOTEL_BLR_ID,
            owner_id: SEED_IDS.ADMIN_USER_ID,
            name: 'StayRoom Lavelle Sanctuary',
            description: 'Boutique timber-and-stone retreat in central Bengaluru.',
            address: '24 Lavelle Road, Ashok Nagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            country_code: 'IN',
            postal_code: '560001',
            latitude: 12.9716,
            longitude: 77.5946,
            timezone: 'Asia/Kolkata',
            amenities: ['WiFi', 'Breakfast', 'Courtyard Garden', 'Airport Transfer'],
            image_urls: ['https://images.stayroom.in/hotels/blr-lavelle-1.jpg'],
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.HOTEL_BOM_ID,
            owner_id: SEED_IDS.ADMIN_USER_ID,
            name: 'StayRoom Marine Drive House',
            description: 'Art-Deco sea-facing residence overlooking the Arabian Sea.',
            address: '118 Netaji Subhash Chandra Bose Road, Churchgate',
            city: 'Mumbai',
            state: 'Maharashtra',
            country_code: 'IN',
            postal_code: '400020',
            latitude: 18.9322,
            longitude: 72.8264,
            timezone: 'Asia/Kolkata',
            amenities: ['WiFi', 'Sea View Lounge', 'Rooftop Dining', 'Concierge'],
            image_urls: ['https://images.stayroom.in/hotels/bom-marine-1.jpg'],
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
        ],
      });

      await tx.hotelRoomType.createMany({
        skipDuplicates: true,
        data: [
          {
            id: SEED_IDS.HRT_BLR_DELUXE_ID,
            hotel_id: SEED_IDS.HOTEL_BLR_ID,
            room_type_master_id: SEED_IDS.RTM_DELUXE_ID,
            description: 'Garden-facing deluxe king room with private balcony.',
            max_guests: 2,
            bed_arrangement: '1 King Bed',
            amenities: ['WiFi', 'Balcony', 'Rain Shower', 'Espresso Bar'],
            image_urls: ['https://images.stayroom.in/rooms/blr-deluxe.jpg'],
            price_per_night: 750000n,
            currency: BOOKING.CURRENCY,
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.HRT_BLR_SUITE_ID,
            hotel_id: SEED_IDS.HOTEL_BLR_ID,
            room_type_master_id: SEED_IDS.RTM_SUITE_ID,
            description: 'Canopy suite with private living lounge and teak tub.',
            max_guests: 4,
            bed_arrangement: '1 King Bed + 1 Daybed',
            amenities: ['WiFi', 'Living Room', 'Soaking Tub', 'Breakfast Included'],
            image_urls: ['https://images.stayroom.in/rooms/blr-suite.jpg'],
            price_per_night: 1250000n,
            currency: BOOKING.CURRENCY,
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.HRT_BOM_STANDARD_ID,
            hotel_id: SEED_IDS.HOTEL_BOM_ID,
            room_type_master_id: SEED_IDS.RTM_STANDARD_ID,
            description: 'Quiet heritage queen room steps from Marine Drive.',
            max_guests: 2,
            bed_arrangement: '1 Queen Bed',
            amenities: ['WiFi', 'Work Desk', 'Rain Shower'],
            image_urls: ['https://images.stayroom.in/rooms/bom-standard.jpg'],
            price_per_night: 680000n,
            currency: BOOKING.CURRENCY,
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.HRT_BOM_SUITE_ID,
            hotel_id: SEED_IDS.HOTEL_BOM_ID,
            room_type_master_id: SEED_IDS.RTM_SUITE_ID,
            description: 'Panoramic sea-view corner suite with private dining salon.',
            max_guests: 3,
            bed_arrangement: '1 King Bed',
            amenities: ['WiFi', 'Sea View', 'Private Lounge', 'Butler Service'],
            image_urls: ['https://images.stayroom.in/rooms/bom-suite.jpg'],
            price_per_night: 1550000n,
            currency: BOOKING.CURRENCY,
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
        ],
      });

      await tx.room.createMany({
        skipDuplicates: true,
        data: [
          {
            id: SEED_IDS.ROOM_BLR_101_ID,
            hotel_id: SEED_IDS.HOTEL_BLR_ID,
            hotel_room_type_id: SEED_IDS.HRT_BLR_DELUXE_ID,
            room_number: '101',
            floor: 1,
            status: 'ACTIVE',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.ROOM_BLR_102_ID,
            hotel_id: SEED_IDS.HOTEL_BLR_ID,
            hotel_room_type_id: SEED_IDS.HRT_BLR_DELUXE_ID,
            room_number: '102',
            floor: 1,
            status: 'ACTIVE',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.ROOM_BLR_201_ID,
            hotel_id: SEED_IDS.HOTEL_BLR_ID,
            hotel_room_type_id: SEED_IDS.HRT_BLR_SUITE_ID,
            room_number: '201',
            floor: 2,
            status: 'ACTIVE',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.ROOM_BOM_101_ID,
            hotel_id: SEED_IDS.HOTEL_BOM_ID,
            hotel_room_type_id: SEED_IDS.HRT_BOM_STANDARD_ID,
            room_number: '101',
            floor: 1,
            status: 'ACTIVE',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.ROOM_BOM_102_ID,
            hotel_id: SEED_IDS.HOTEL_BOM_ID,
            hotel_room_type_id: SEED_IDS.HRT_BOM_STANDARD_ID,
            room_number: '102',
            floor: 1,
            status: 'ACTIVE',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
          {
            id: SEED_IDS.ROOM_BOM_301_ID,
            hotel_id: SEED_IDS.HOTEL_BOM_ID,
            hotel_room_type_id: SEED_IDS.HRT_BOM_SUITE_ID,
            room_number: '301',
            floor: 3,
            status: 'ACTIVE',
            created_by: SYSTEM_ACTOR_ID,
            updated_by: SYSTEM_ACTOR_ID,
          },
        ],
      });
    });

    logger.info('Database seed completed via bulk Prisma createMany');
  } finally {
    await db.disconnect();
  }
}

runSeed().catch((err: unknown) => {
  console.error('Database seed failed:', err);
  process.exit(1);
});