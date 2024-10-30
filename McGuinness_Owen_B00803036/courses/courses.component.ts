import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: any[] = [];
  filteredCourses: any[] = [];
  searchText: string = '';
  newCourse: any = {}; // New course object to bind form data

  constructor(private webService: WebService) { }

  ngOnInit(): void {
    this.getCourses();
  }

  getCourses() {
    this.webService.getCourses().subscribe(
      (response: any) => {
        this.courses = response;
        this.filteredCourses = [...this.courses];
      },
      (error: any) => {
        console.error('Error fetching courses:', error);
      }
    );
  }

  searchCourses() {
    this.filteredCourses = this.courses.filter(course =>
      course.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  openAddCourseModal() {
    const modal = document.getElementById('addCourseModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeAddCourseModal() {
    const modal = document.getElementById('addCourseModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  addCourse() {
    if (!this.newCourse.name || !this.newCourse.code || !this.newCourse.department || !this.newCourse.level || !this.newCourse.lecturer || !this.newCourse.description || !this.newCourse.campus) {
      console.error('Name, code, department, level, lecturer, description, and campus are required');
      return;
    }
  
    console.log('New Course:', this.newCourse);
  
    this.webService.createCourse(this.newCourse).subscribe(
      (response: any) => {
        console.log('Course created successfully:', response);
        this.closeAddCourseModal();
        location.reload();
      },
      (error: any) => {
        console.error('Error adding course:', error);
      }
    );
  }  
}
