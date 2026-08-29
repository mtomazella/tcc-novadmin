export interface User {
  permissions: string[];
  email: string;
  id?: string;
  name?: string;
}
  
export interface AuthContextType {
  currentUser: User | null;
  login: (userData: User) => void;
  logout: () => void;
}