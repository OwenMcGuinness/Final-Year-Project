import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  userProfile: any;

  constructor(private webService: WebService) { }

  ngOnInit() {
    this.webService.getProfile().subscribe(
      (profile: any) => {
        this.userProfile = profile;
      },
      (error: any) => {
        console.error('Error fetching user profile:', error);
      }
    );
  }
}
