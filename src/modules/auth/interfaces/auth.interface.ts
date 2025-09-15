export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
