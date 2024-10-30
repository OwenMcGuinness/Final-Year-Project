import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  searchText: string = '';
  newUser: any = {};
  usernameExists: boolean = false;

  constructor(public webService: WebService) { }

  ngOnInit(): void {
    this.getUsers();

  }

  getUsers() {
    const token = localStorage.getItem('AuthToken');
    if (!token) {
      throw new Error('No token found');
    }
  
    const headers = new HttpHeaders({
      'x-access-token': token,
    });
  
    this.webService.getUsers(headers).subscribe(
      (response: any) => {
        console.log('Users:', response);
        this.users = response.users;
      },
      (error: any) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  searchUsers() {
    if (this.searchText.trim() !== '') {
      this.webService.searchUsers(this.searchText).subscribe(
        (response: any) => {
          this.users = response.users;
        },
        (error: any) => {
          console.error('Error searching users:', error);
        }
      );
    } else {
      this.getUsers();
    }
    console.log('Search Text:', this.searchText);
  }  

  createUser(user: any): Observable<any> {
    const formData = this.convertObjectToFormData(user);
    return this.webService.createUser(formData);
  }

  addNewUser() {
    if (!this.newUser.username || !this.newUser.email) {
      console.error('Username and email are required');
      return;
    }

    this.webService.createUser(this.newUser).subscribe(
      (response: any) => {
        console.log('User created successfully:', response);
        this.closeAddUserModal();
        location.reload();
      },
      (error: any) => {
        if (error.status === 200 && error.error.usernameExists) {
          this.usernameExists = true;
        } else {
          console.error('Error creating user:', error);
        }
      }
    );
  }  

  private convertObjectToFormData(obj: any): FormData {
    const formData = new FormData();
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        formData.append(key, obj[key]);
      }
    }
    return formData;
  }

  openAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
}
