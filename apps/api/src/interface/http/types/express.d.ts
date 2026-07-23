// Augments Express's Request type with the `user` field the `authenticate`
// middleware attaches after verifying a JWT. Declaration merging (adding
// properties to a type declared in another package) is a TypeScript
// feature with no real Express/JS equivalent - in plain JS you'd just
// attach `req.user` and hope every reader remembers it's there; here the
// compiler enforces that any code reading `req.user` knows its real shape.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export {};
