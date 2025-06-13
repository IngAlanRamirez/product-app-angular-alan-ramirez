import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHelper } from './http-helper';

/**
 * Pruebas unitarias para HttpHelper.
 */
describe('HttpHelper', () => {
  let httpHelper: HttpHelper;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpHelper]
    });
    httpHelper = TestBed.inject(HttpHelper);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe realizar GET correctamente', () => {
    httpHelper.get('/api/test').subscribe(res => {
      expect(res).toEqual({ ok: true });
    });
    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('debe realizar POST correctamente', () => {
    httpHelper.post('/api/test', { foo: 'bar' }).subscribe(res => {
      expect(res).toEqual({ created: true });
    });
    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ foo: 'bar' });
    req.flush({ created: true });
  });

  it('debe realizar PUT correctamente', () => {
    httpHelper.put('/api/test', { foo: 'baz' }).subscribe(res => {
      expect(res).toEqual({ updated: true });
    });
    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ foo: 'baz' });
    req.flush({ updated: true });
  });

  it('debe realizar DELETE correctamente', () => {
    httpHelper.delete('/api/test').subscribe(res => {
      expect(res).toEqual({ deleted: true });
    });
    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
  });

  it('debe manejar errores correctamente', (done) => {
    httpHelper.get('/api/error').subscribe({
      next: () => {},
      error: (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('Ocurrió un error');
        done();
      }
    });
    const req = httpMock.expectOne('/api/error');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
