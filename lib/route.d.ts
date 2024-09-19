import type { Request, Response } from "./adapter";
export declare enum Methods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    OPTIONS = "OPTIONS"
}
export interface Route {
    method: Methods;
    path: string;
    callback: (req: Request, res: Response) => void;
}
