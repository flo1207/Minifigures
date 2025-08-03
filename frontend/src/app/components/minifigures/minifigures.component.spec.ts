import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinifiguresComponent } from './minifigures.component';

describe('MinifiguresComponent', () => {
  let component: MinifiguresComponent;
  let fixture: ComponentFixture<MinifiguresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinifiguresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinifiguresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
