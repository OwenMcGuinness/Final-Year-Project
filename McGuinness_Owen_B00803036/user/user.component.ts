import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  user: any;

  constructor(private route: ActivatedRoute, private router: Router, private webService: WebService) {}

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.fetchUser(username);
    } else {
      console.error('Username not found in route parameters');
    }
  }

  fetchUser(username: string) {
    this.webService.getUser(username).subscribe(
      (response: any) => {
        this.user = response;
      },
      (error: any) => {
        console.error('Error fetching user:', error);
      }
    );
  }

  updateUser() {
    if (this.user) {
      const username = this.user.username;
      this.webService.updateUser(username, this.user).subscribe(
        () => {
          console.log('User updated successfully');
          this.closeEditUserModal();
        },
        (error: any) => {
          console.error('Error updating user:', error);
        }
      );
    } else {
      console.error('User data is missing');
    }
  }   

  deleteUser() {
    if (!this.user) {
      console.error('User not found.');
      return;
    }
    const username = this.user.username;
    this.webService.deleteUser(username).subscribe(
      (response: any) => {
        console.log('User deleted successfully:', response);
        this.router.navigate(['/users']);
      },
      (error: any) => {
        console.error('Error deleting user:', error);
      }
    );
  }

  confirmDeleteUser() {
    const isConfirmed = window.confirm('Are you sure you want to delete this user?');
    if (isConfirmed) {
      this.deleteUser();
    }
  }

  openEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }
  
  closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }  
  
}
