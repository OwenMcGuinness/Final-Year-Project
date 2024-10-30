import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../web.service';
import { Observable } from 'rxjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit {
  courseId!: string;
  course: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webService: WebService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('_id');
      if (id) {
        this.courseId = id;
        this.getCourse();
      } else {
        console.error('Course ID is null');
      }
    });
  }

  getCourse() {
    this.webService.getCourse(this.courseId).subscribe(
      (response: any) => {
        this.course = response;
      },
      (error: any) => {
        console.error('Error fetching course:', error);
      }
    );
  }

  editCourse() {
    this.router.navigate(['/courses', this.courseId, 'edit']);
  }

  deleteCourse() {
    if (confirm('Are you sure you want to delete this course?')) {
      this.webService.deleteCourse(this.courseId).subscribe(
        () => {
          console.log('Course deleted successfully');
          this.location.back();
        },
        (error: any) => {
          console.error('Error deleting course:', error);
        }
      );
    }
  }
}
