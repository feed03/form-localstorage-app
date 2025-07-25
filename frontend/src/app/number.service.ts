import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NumberService {
  private apiUrl = 'http://localhost:3000/api/numero';

  constructor(private http: HttpClient) {}

  getRandomNumber(): Observable<{ numero: number }> {
    return this.http.get<{ numero: number }>(this.apiUrl);
  }
}
