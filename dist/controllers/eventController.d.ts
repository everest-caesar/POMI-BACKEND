import { Request, Response } from 'express';
export declare const createEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEvents: (req: Request, res: Response) => Promise<void>;
export declare const getEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const rsvpEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelRsvp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserEvents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingEvents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const approveEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const rejectEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=eventController.d.ts.map