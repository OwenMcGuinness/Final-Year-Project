import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { WebService } from '../web.service'; 

interface ChatMessage {
  text: string;
  type: 'user' | 'chatbot';
  showFeedbackButton?: boolean;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  userInput: string = '';
  chatMessages: ChatMessage[] = [];
  showChatWindow = false;
  feedback: string = ''; 
  helpful: boolean = false; 
  notHelpful: boolean = false; 

  constructor(private http: HttpClient, private webService: WebService) { } 

  sendUserInput(): void {
    const body = new HttpParams().set('user_input', this.userInput);

    this.http.post('http://localhost:5000/api/v1.0/chatbot',
      body.toString(),
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }
    ).subscribe(
      (response: any) => {
        this.chatMessages.push({ text: this.userInput, type: 'user' });
        const responses = response.response.split('\n');
        responses.forEach((res: string, index: number) => {
          const message: ChatMessage = { text: res, type: 'chatbot' };
          if (index === responses.length - 1) {
            message.showFeedbackButton = true;
          }
          this.chatMessages.push(message);
        });
        this.userInput = '';
      },
    );
  }

  toggleChatWindow(): void {
    this.showChatWindow = !this.showChatWindow;
  }

  openFeedbackForm(message: ChatMessage): void {
    const intentIdMatch = message.text.match(/\(Intent ID: (\w+)\)/);
    if (intentIdMatch) {
      const intentId = intentIdMatch[1]; 
      console.log('Open feedback form for Intent ID:', intentId);
    } else {
      console.warn('No intent ID found in the message:', message.text);
    }
  }

  closeFeedbackModal(): void {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
  
  submitFeedback(): void {
    console.log('Feedback:', this.feedback);
    console.log('Helpful:', this.helpful);
    console.log('Not Helpful:', this.notHelpful);
  }
}
