export interface User {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
  organizations: {
    organization: {
      id: string;
      name: string;
    };
  }[];
}