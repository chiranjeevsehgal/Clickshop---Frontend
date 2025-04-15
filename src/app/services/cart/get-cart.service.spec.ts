import { TestBed } from '@angular/core/testing';

import { GetCartService } from './get-cart.service';

describe('GetCartService', () => {
  let service: GetCartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetCartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
