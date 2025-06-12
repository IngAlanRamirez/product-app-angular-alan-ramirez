import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HttpHelper {
  constructor(private http: HttpClient) {}

  get<T>(url: string, params?: HttpParams | {[param: string]: string | number | boolean}, headers?: HttpHeaders | {[header: string]: string | string[]}): Observable<T> {
    return this.http.get<T>(url, { params, headers })
      .pipe(
        tap(() => this.log('GET', url)),
        catchError(err => this.handleError(err, 'GET', url))
      );
  }

  post<T>(url: string, body: any, headers?: HttpHeaders | {[header: string]: string | string[]}): Observable<T> {
    return this.http.post<T>(url, body, { headers })
      .pipe(
        tap(() => this.log('POST', url)),
        catchError(err => this.handleError(err, 'POST', url))
      );
  }

  put<T>(url: string, body: any, headers?: HttpHeaders | {[header: string]: string | string[]}): Observable<T> {
    return this.http.put<T>(url, body, { headers })
      .pipe(
        tap(() => this.log('PUT', url)),
        catchError(err => this.handleError(err, 'PUT', url))
      );
  }

  delete<T>(url: string, headers?: HttpHeaders | {[header: string]: string | string[]}): Observable<T> {
    return this.http.delete<T>(url, { headers })
      .pipe(
        tap(() => this.log('DELETE', url)),
        catchError(err => this.handleError(err, 'DELETE', url))
      );
  }

  private log(method: string, url: string) {
    console.info(`[HttpHelper] ${method} request to: ${url}`);
  }

  private handleError(error: any, method: string, url: string) {
    console.error(`[HttpHelper] Error in ${method} ${url}:`, error);
    // Puedes personalizar el mensaje de error según tus necesidades
    return throwError(() => new Error('Ocurrió un error en la petición HTTP. Intenta de nuevo más tarde.'));
  }
}
