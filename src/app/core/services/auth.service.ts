import { Injectable, signal } from '@angular/core';

export interface User {
  email: string;
  password?: string;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user = signal<User | null>(null);

  constructor() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }
  }

  register(email: string, password: string, role: 'admin' | 'user' = 'user') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exists = users.find((u: any) => u.email === email);

    if (exists) {
      throw new Error('User already exists');
    }

    const newUser = { email, password, role };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    console.log(` Registered as ${role}:`, email);
  }

  forceAdmin(email: string) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email);
    
    if (userIndex !== -1) {
      users[userIndex].role = 'admin';
      localStorage.setItem('users', JSON.stringify(users));
      
      const currentUser = this.user();
      if (currentUser && currentUser.email === email) {
        currentUser.role = 'admin';
        localStorage.setItem('user', JSON.stringify(currentUser));
        this.user.set(currentUser);
      }
      
      console.log(` User ${email} is now admin`);
      return true;
    }
    return false;
  }

  login(email: string, password: string) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (!found) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = found;
    
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    this.user.set(userWithoutPassword);
    
    console.log(` Logged in as:`, userWithoutPassword);
  }

  logout() {
    localStorage.removeItem('user');
    this.user.set(null);
  }

  isAuthenticated() {
    return this.user() !== null;
  }

  isAdmin() {
    return this.user()?.role === 'admin';
  }

  isUser() {
    return this.user()?.role === 'user';
  }

  getRole() {
    return this.user()?.role;
  }
}