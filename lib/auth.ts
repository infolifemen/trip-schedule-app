// Client-side authentication with SHA-256 hashing
// WARNING: This is client-side only - passwords are hashed but the code is public

export interface User {
  username: string;
  passwordHash: string;
  salt: string;
  isAdmin?: boolean;
}

const STORAGE_KEY = 'trip_auth_users';
const TOKEN_KEY = 'trip_auth_token';
const TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

// Generate SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random salt
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash password with salt
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltToUse = salt || generateSalt();
  const hash = await sha256(password + saltToUse);
  return { hash, salt: saltToUse };
}

// Get all users from localStorage
export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save users to localStorage
export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Initialize default users (called once on first load)
export async function initializeDefaultUsers(): Promise<void> {
  const existing = getUsers();
  if (existing.length > 0) return; // Already initialized

  const defaultUsers = [
    { username: 'admin', password: 'admin123', isAdmin: true },
    { username: 'user1', password: 'pass123' },
    { username: 'user2', password: 'pass123' },
    { username: 'user3', password: 'pass123' },
    { username: 'user4', password: 'pass123' },
    { username: 'user5', password: 'pass123' },
    { username: 'user6', password: 'pass123' },
    { username: 'user7', password: 'pass123' },
    { username: 'user8', password: 'pass123' },
    { username: 'user9', password: 'pass123' },
  ];

  const users: User[] = [];
  for (const u of defaultUsers) {
    const { hash, salt } = await hashPassword(u.password);
    users.push({
      username: u.username,
      passwordHash: hash,
      salt,
      isAdmin: u.isAdmin || false,
    });
  }

  saveUsers(users);
}

// Validate password
export async function validatePassword(username: string, password: string): Promise<boolean> {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return false;

  const { hash } = await hashPassword(password, user.salt);
  return hash === user.passwordHash;
}

// Login
export async function login(username: string, password: string): Promise<boolean> {
  const valid = await validatePassword(username, password);
  if (!valid) return false;

  const token = {
    username,
    expires: Date.now() + TOKEN_EXPIRY,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return true;
}

// Logout
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Check if logged in
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  try {
    const parsed = JSON.parse(token);
    if (parsed.expires < Date.now()) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Get current user
export function getCurrentUser(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const parsed = JSON.parse(token);
    if (parsed.expires < Date.now()) {
      logout();
      return null;
    }
    return parsed.username;
  } catch {
    return null;
  }
}

// Check if current user is admin
export function isAdmin(): boolean {
  const username = getCurrentUser();
  if (!username) return false;
  const users = getUsers();
  const user = users.find(u => u.username === username);
  return user?.isAdmin || false;
}

// Add new user
export async function addUser(username: string, password: string, isAdminUser: boolean = false): Promise<boolean> {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return false; // User already exists
  }

  const { hash, salt } = await hashPassword(password);
  users.push({
    username,
    passwordHash: hash,
    salt,
    isAdmin: isAdminUser,
  });
  saveUsers(users);
  return true;
}

// Update password
export async function updatePassword(username: string, newPassword: string): Promise<boolean> {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return false;

  const { hash, salt } = await hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  saveUsers(users);
  return true;
}

// Remove user
export function removeUser(username: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.username !== username);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}

// List all users (without passwords)
export function listUsers(): Array<{ username: string; isAdmin: boolean }> {
  return getUsers().map(u => ({
    username: u.username,
    isAdmin: u.isAdmin || false,
  }));
}
