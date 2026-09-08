export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

// In-memory user store using a Map. 
// NOTE: Swap this for a real database (PostgreSQL, MongoDB, etc.) in production.
const users = new Map<string, User>();

export const saveUser = (user: User): User => {
  users.set(user.id, user);
  return user;
};

export const getUser = (userId: string): User | undefined => {
  return users.get(userId);
};

export const getUserByEmail = (email: string): User | undefined => {
  for (const user of users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};
