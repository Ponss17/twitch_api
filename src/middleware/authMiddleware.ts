import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
}

const checkToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.query.token as string;

    if (!token) {
        return res.status(401).send('Error: Token no proporcionado. Debes incluir ?token=TU_TOKEN en la URL.');
    }

    req.twitchToken = token;
    next();
};

export default checkToken;
