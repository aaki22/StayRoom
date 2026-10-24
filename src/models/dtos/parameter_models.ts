import { z } from 'zod';

export interface HotelParamsDTO {
  hotelId: string;
}

export interface RoomTypeParamsDTO {
  hotelId: string;
  roomTypeId: string;
}

export interface RoomParamsDTO {
  hotelId: string;
  roomId: string;
}

export interface BookingParamsDTO {
  bookingId: string;
}

export interface RefundParamsDTO {
  refundId: string;
}

export const hotelParamsSchema = z
  .object({
    hotelId: z.uuid(),
  })
  .strict();

export const roomTypeParamsSchema = z
  .object({
    hotelId: z.uuid(),
    roomTypeId: z.uuid(),
  })
  .strict();

export const roomParamsSchema = z
  .object({
    hotelId: z.uuid(),
    roomId: z.uuid(),
  })
  .strict();

export const bookingParamsSchema = z
  .object({
    bookingId: z.uuid(),
  })
  .strict();

export const refundParamsSchema = z
  .object({
    refundId: z.uuid(),
  })
  .strict();