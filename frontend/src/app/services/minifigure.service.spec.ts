import { TestBed } from '@angular/core/testing';

import { MinifigureService } from './minifigure.service';

describe('MinifigureService', () => {
  let service: MinifigureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MinifigureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
