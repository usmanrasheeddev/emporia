// ═══════════════════════════════════════════════════════════════
// Search Routes
// Public search routes with validation and cache optimization
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { SearchController } from './search.controller';
import { validate } from '../../middleware/validate.middleware';
import { cacheResponse } from '../../middleware/cache.middleware';
import { searchParamsSchema, autocompleteSchema } from './search.validator';
import { CACHE_TTL } from '@nexastore/shared';

const router = Router();

router.get('/', validate(searchParamsSchema, 'query'), cacheResponse(CACHE_TTL.SHORT), SearchController.search);
router.get('/autocomplete', validate(autocompleteSchema, 'query'), cacheResponse(CACHE_TTL.SHORT), SearchController.autocomplete);

export default router;
//
