import 'express-session';
import { UserRole } from 'src/user/entities/user.entity';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: UserRole;
  }
}
