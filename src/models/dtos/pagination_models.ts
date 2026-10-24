import { z } from 'zod';
import { PAGINATION } from '../../constants/constants.ts';

export interface PaginationQueryDTO {
  page: number;
  limit: number;
}

export interface PageMetaDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PageDTO<T> {
  items: T[];
  pagination: PageMetaDTO;
}

export const paginationQueryFields = {
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
};

export const paginationQuerySchema = z.object(paginationQueryFields).strict();

export function buildPageMeta(page: number, limit: number, totalItems: number): PageMetaDTO {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
  };
}