import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';

@Component({
  selector: 'app-intent',
  templateUrl: './intent.component.html',
  styleUrls: ['./intent.component.css']
})
export class IntentComponent implements OnInit {
  intent: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webService: WebService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const intentId = params.get('_id');
      if (intentId) {
        this.fetchIntent(intentId);
      }
    });
  }

  fetchIntent(intentId: string) {
    this.webService.getIntent(intentId).subscribe(
      (response: any) => {
        this.intent = response;
      },
      (error: any) => {
        console.error('Error fetching intent:', error);
      }
    );
  }

  updateIntent() {
    if (!this.intent.tag || !this.intent.pattern || !this.intent.responses || !this.intent.roles) {
      console.error('Tag, pattern, responses, and roles are required');
      return;
    }
  
    console.log('Updated Intent:', this.intent);
  
    this.webService.updateIntent(this.intent._id, this.intent).subscribe(
      (response: any) => {
        console.log('Intent updated successfully:', response);
        this.closeUpdateIntentModal();
      },
      (error: any) => {
        console.error('Error updating intent:', error);
      }
    );
  }

  deleteFeedback(index: number) {
    if (confirm('Are you sure you want to delete this feedback?')) {
      this.intent.feedback.splice(index, 1);
      this.webService.updateIntent(this.intent._id, this.intent).subscribe(
        (response: any) => {
          console.log('Feedback deleted successfully:', response);
        },
        (error: any) => {
          console.error('Error deleting feedback:', error);
        }
      );
    }
  }

  openUpdateIntentModal() {
    const modal = document.getElementById('updateIntentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeUpdateIntentModal() {
    const modal = document.getElementById('updateIntentModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  deleteIntent(intentId: string) {
    if (confirm('Are you sure you want to delete this intent?')) {
      this.webService.deleteIntent(intentId).subscribe(
        () => {
          this.router.navigate(['/intents']);
        },
        (error: any) => {
          console.error('Error deleting intent:', error);
        }
      );
    }
  }
}
