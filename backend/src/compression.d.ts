declare module 'compression' {
  import { RequestHandler } from 'express';
  function compression(options?: { filter?: (req: unknown, res: unknown) => boolean; level?: number }): RequestHandler;
  export = compression;
}
