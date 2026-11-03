import { db } from './db/database';

export interface DbUser {
  id: number; email: string; password: string; display_name: string;
  role: string; avatar_color: string; created_at: string;
}

export function findUserById(id: number | string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
}
export function findUserByEmail(email: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined;
}

export function publicUser(u: DbUser) {
  return { id: u.id, email: u.email, display_name: u.display_name, role: u.role, avatar_color: u.avatar_color };
}

export function memberCard(u: DbUser) {
  return { id: u.id, display_name: u.display_name, email: u.email, role: u.role, avatar_color: u.avatar_color };
}
