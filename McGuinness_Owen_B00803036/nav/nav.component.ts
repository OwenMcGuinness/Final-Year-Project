import { Component } from '@angular/core';
import { WebService } from '../web.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  username: string = '';
  password: string = '';
  loginError: string = ''; 

  constructor(private webService: WebService) {}

  login() {
    this.loginError = ''; 
    this.webService.login(this.username, this.password).subscribe(
      (response: any) => {
        console.log('Login successful:', response.token);
        localStorage.setItem('AuthToken', response.token);
        this.isLoggedIn = true;
      },
      (error: any) => {
        console.error('Login failed:', error);
        if (error.status === 401) {
          this.loginError = 'Invalid username or password. Please try again.';
          setTimeout(() => {
            this.loginError = '';
          }, 3000);
        } else {
          this.loginError = 'An error occurred during login. Please try again later.';
        }
      }
    );
  }  

  logout() {
    this.isLoggedIn = false;
        this.isAdmin = false;
  }
}
