/**
 * Interceptor global para manejar errores HTTP en toda la aplicación.
 * Muestra un mensaje de error amigable usando MatSnackBar cuando ocurre un error HTTP.
 */
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let mensaje = 'Ocurrió un error inesperado.';
        if (error.error && error.error.message) {
          mensaje = error.error.message;
        } else if (error.status === 0) {
          mensaje = 'No se pudo conectar con el servidor.';
        } else if (error.status) {
          mensaje = `Error ${error.status}: ${error.statusText}`;
        }
        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 4000,
          panelClass: 'snackbar-error'
        });
        return throwError(() => error);
      })
    );
  }
}
