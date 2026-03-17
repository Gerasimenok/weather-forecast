import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-make-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './make-admin.html',
  styleUrls: ['./make-admin.scss']
})
export class MakeAdminComponent {
  private authService = inject(AuthService);
  
  get currentUser() {
    return this.authService.user();
  }
  
  makeAdmin() {
    if (this.currentUser) {
      const success = this.authService.forceAdmin(this.currentUser.email);
      if (success) {
        alert('You are now admin! The page will reload.');
        window.location.reload();
      }
    }
  }
}