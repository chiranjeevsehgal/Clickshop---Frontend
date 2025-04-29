import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = 'http://localhost:8081/gemini';

  constructor(
    private http: HttpClient
  ) { }

  async getAiResponse(prompt: string): Promise<string> {
    const response = await lastValueFrom(
      this.http.post<{ response: string }>(this.apiUrl, { prompt })
    );
    return response.response;
  }

  async getAiResponse_Agent(prompt: string): Promise<string> {
    const response = await lastValueFrom(
      this.http.post<{ response: string }>(this.apiUrl, { prompt })
    );
    return response.response;
  }

}
