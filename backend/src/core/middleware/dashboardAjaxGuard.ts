import { Request, Response, NextFunction } from 'express';
import { jsonError } from '../utils/jsonResponse';

/** Requiere header de petición AJAX del panel (defensa extra frente a navegación cross-site). */
export function requireDashboardAjax(req: Request, res: Response, next: NextFunction) {
    if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
        return jsonError(res, 403, 'Solicitud no permitida.', { code: 'AJAX_REQUIRED' });
    }
    return next();
}
