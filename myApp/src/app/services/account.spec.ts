import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Account } from './account';

describe('Account', () => {
  let service: Account;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Account);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
