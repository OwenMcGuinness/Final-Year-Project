import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';

@Component({
  selector: 'app-campuses',
  templateUrl: './campuses.component.html',
  styleUrls: ['./campuses.component.css']
})
export class CampusesComponent implements OnInit {
  campuses: any[] = [];
  newCampus: any = {
    name: '',
    location: '',
    established_year: null,
    undergraduate_population: null,
    graduate_population: null,
    faculties: [],
    sports_facilities: [],
    student_clubs: [],
    library: false,
    cafeteria: false,
    dormitories: false
  };
  searchText: string = '';

  constructor(private webService: WebService) { }

  ngOnInit(): void {
    this.getCampuses();
  }

  getCampuses() {
    this.webService.getCampuses().subscribe(
      (response: any) => {
        this.campuses = response;
      },
      (error: any) => {
        console.error('Error fetching campuses:', error);
      }
    );
  }

  onSubmit() {
    this.newCampus.faculties = this.newCampus.faculties.split(',').map((faculty: string) => faculty.trim());
  
    this.webService.createCampus(this.newCampus).subscribe(
      (response: any) => {
        console.log('Campus created successfully:', response);
        this.closeAddCampusModal();
        this.getCampuses();
        this.resetForm();
      },
      (error: any) => {
        console.error('Error creating campus:', error);
      }
    );
  }

  openAddCampusModal() {
    const modal = document.getElementById('addCampusModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeAddCampusModal() {
    const modal = document.getElementById('addCampusModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  resetForm() {
    this.newCampus = {
      name: '',
      location: '',
      established_year: null,
      undergraduate_population: null,
      graduate_population: null,
      faculties: [],
      sports_facilities: [],
      student_clubs: [],
      library: false,
      cafeteria: false,
      dormitories: false
    };
  }
}
