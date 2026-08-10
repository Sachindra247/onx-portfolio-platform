export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  group: string;
  certificationsAccess: string;
  eventsAccess: string;
  vacationAccess: string;
  isGlobalAdministrator: boolean;
  managerId: string | null;
  managerName: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: AuthUser;
}
