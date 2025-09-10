import { User } from '../../models/User';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      permissions?: string[];
    }

    interface Request {
      user?: User;
    }
  }
}
