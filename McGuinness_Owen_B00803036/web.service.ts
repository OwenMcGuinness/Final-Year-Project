import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
  })
  
export class WebService {

    constructor(private http: HttpClient) { }

    getChatbotResponse(userInput: string): Observable<string[]> {
        return this.http.post<any>('http://localhost:5000/api/v1.0/chatbot', { user_input: userInput }).pipe(
          map((response: any) => response.response.split('\n')) 
        );
      }   

    login(username: string, password: string): Observable<any> {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(username + ':' + password)
          })
        };
    
        return this.http.post<any>('http://localhost:5000/api/v1.0/login', {}, httpOptions);
      }
    
      getProfile(): Observable<any> {
        const token = localStorage.getItem('AuthToken');
        if (!token) {
          throw new Error('No token found');
        }
    
        const headers = new HttpHeaders({
          'x-access-token': token,
        });
    
        return this.http.get<any>('http://localhost:5000/api/v1.0/profile', { headers });
      }

      getUsers(headers: HttpHeaders): Observable<any> {
        return this.http.get('http://localhost:5000/api/v1.0/users', { headers });
      }

    getUser(username: string): Observable<any> {
        return this.http.get('http://localhost:5000/api/v1.0/users/' + username);
    }

    searchUsers(query: string, role?: string): Observable<any> {
        let params = new HttpParams().set('query', query || '');
        if (role !== undefined && role.trim() !== '') {
          params = params.set('role', role);
        }
        return this.http.get('http://localhost:5000/api/v1.0/users/search', { params });
    }        

    createUser(user: any): Observable<any> {
        const formData = this.convertObjectToFormData(user);
        return this.http.post('http://localhost:5000/api/v1.0/users', formData);
    }

    updateUser(username: string, user: any): Observable<any> {
        const formData = this.convertObjectToFormData(user);
        return this.http.put('http://localhost:5000/api/v1.0/users/' + username, formData);
    }

    deleteUser(username: string): Observable<any> {
        return this.http.delete('http://localhost:5000/api/v1.0/users/' + username);
    }

    getIntents(): Observable<any> {
        return this.http.get('http://127.0.0.1:5000/api/v1.0/intents');
    }

    getIntent(intentId: string): Observable<any> {
        return this.http.get('http://localhost:5000/api/v1.0/intents/' + intentId);
    }

    searchIntents(query: string): Observable<any> {
        const params = new HttpParams().set('query', query || '');
        return this.http.get('http://localhost:5000/api/v1.0/intents/search', { params });
    }

    createIntent(intent: any): Observable<any> {
        const formData = this.convertObjectToFormData(intent);
        return this.http.post('http://localhost:5000/api/v1.0/intents', formData);
    }

    updateIntent(intentId: string, intent: any): Observable<any> {
        const formData = this.convertObjectToFormData(intent);
        return this.http.put('http://localhost:5000/api/v1.0/intents/' + intentId, formData);
    }

    deleteIntent(intentId: string): Observable<any> {
        return this.http.delete('http://localhost:5000/api/v1.0/intents/' + intentId);
    }

    getAllIntentFeedback(intentId: string): Observable<any> {
      return this.http.get(`http://localhost:5000/api/v1.0/intents/${intentId}/feedback`);
   }

   addIntentFeedback(intentId: string, feedback: any): Observable<any> {
      return this.http.post(`http://localhost:5000/api/v1.0/intents/${intentId}/feedback`, feedback);
 
   }

    addIntent(intent: any): Observable<any> {
      return this.http.post('http://localhost:5000/api/v1.0/intents', intent);
   }

   deleteIntentFeedback(intentId: string, feedbackIndex: number): Observable<any> {
      return this.http.delete(`http://localhost:5000/api/v1.0/intents/${intentId}/feedback/${feedbackIndex}`);
   }

    getCampuses(): Observable<any> {
        return this.http.get('http://localhost:5000/api/v1.0/campuses');
    }

    getCampus(campusId: string): Observable<any> {
        return this.http.get('http://localhost:5000/api/v1.0/campuses/' + campusId);
    }    

    createCampus(campus: any): Observable<any> {
        const formData = this.convertObjectToFormData(campus);
        return this.http.post('http://localhost:5000/api/v1.0/campuses', formData);
    }

    updateCampus(campusId: string, campus: any): Observable<any> {
        const formData = this.convertObjectToFormData(campus);
        return this.http.put(`http://localhost:5000/api/v1.0/campuses/${campusId}`, formData);
    }

    deleteCampus(campusId: string): Observable<any> {
        return this.http.delete(`http://localhost:5000/api/v1.0/campuses/${campusId}`);
    }

    getCourses(): Observable<any> {
        return this.http.get('http://localhost:5000/api/v1.0/courses');
    }

    getCourse(courseId: string): Observable<any> {
        return this.http.get(`http://localhost:5000/api/v1.0/courses/${courseId}`);
    }

    searchCourses(query: string): Observable<any> {
        const params = new HttpParams().set('query', query || '');
        return this.http.get('http://localhost:5000/api/v1.0/courses/search', {
          params,
        });
      }
    
      createCourse(course: any): Observable<any> {
        return this.http.post('http://localhost:5000/api/v1.0/courses', course, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          })
        });
      }      
    
      editCourse(courseId: string, course: any): Observable<any> {
        const formData = this.convertObjectToFormData(course);
        return this.http.put(
          `http://localhost:5000/api/v1.0/courses/${courseId}`,formData);
      }
      
      deleteCourse(courseId: string): Observable<any> {
        return this.http.delete(`http://localhost:5000/api/v1.0/courses/${courseId}`);
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
}
