// ═══════════════════════════════════════════════════════════════
// Search Controller Layer
// Maps HTTP endpoints to Search services
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { SearchService } from './search.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

const service = new SearchService();

export class SearchController {
  static search = asyncHandler(async (req: Request, res: Response) => {
    const { products, facets, meta } = await service.searchProducts(req.query);
    res.json(
      ApiResponse.success('Search results retrieved', { products, facets }, 200, meta)
    );
  });

  static autocomplete = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const suggestions = await service.autocomplete(q);
    res.json(ApiResponse.success('Suggestions retrieved', suggestions));
  });
}
