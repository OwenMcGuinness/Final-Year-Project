import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intents',
  templateUrl: './intents.component.html',
  styleUrls: ['./intents.component.css']
})
export class IntentsComponent implements OnInit {
  intents: any[] = [];
  searchText: string = '';
  newIntent: any = {};

  constructor(public webService: WebService, private router: Router) { }

  ngOnInit(): void {
    this.getIntents();
  }

  getIntents() {
    this.webService.getIntents().subscribe(
      (response: any) => {
        this.intents = response;
        console.log(response);
      },
      (error: any) => {
        console.error('Error fetching intents:', error);
      }
    );
  }

  searchIntents() {
    if (this.searchText.trim() !== '') {
      this.webService.searchIntents(this.searchText).subscribe(
        (response: any) => {
          this.intents = response;
        },
        (error: any) => {
          console.error('Error searching intents:', error);
        }
      );
    } else {
      this.getIntents();
    }
    console.log('Search Text:', this.searchText);
  }

  createIntent(intent: any): Observable<any> {
    const formData = this.convertObjectToFormData(intent);
    return this.webService.createIntent(formData);
  }

  addNewIntent() {
    if (!this.newIntent.tag || !this.newIntent.pattern || !this.newIntent.responses || !this.newIntent.roles) {
      console.error('Tag, pattern, responses, and roles are required');
      return;
    }

    console.log('New Intent:', this.newIntent);

    this.webService.createIntent(this.newIntent).subscribe(
      (response: any) => {
        console.log('Intent created successfully:', response);
        this.closeAddIntentModal();
        location.reload();
      },
      (error: any) => {
        console.error('Error creating intent:', error);
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

  openAddIntentModal() {
    const modal = document.getElementById('addIntentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeAddIntentModal() {
    const modal = document.getElementById('addIntentModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
  
}
