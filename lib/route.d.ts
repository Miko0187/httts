import type { Request, Response } from "./adapter";
export interface Route {
    method: string;
    path: string;
    callback: (req: Request, res: Response) => void;
}
