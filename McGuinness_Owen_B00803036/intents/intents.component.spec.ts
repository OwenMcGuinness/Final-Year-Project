import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntentsComponent } from './intents.component';

describe('IntentsComponent', () => {
  let component: IntentsComponent;
  let fixture: ComponentFixture<IntentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IntentsComponent]
    });
    fixture = TestBed.createComponent(IntentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
