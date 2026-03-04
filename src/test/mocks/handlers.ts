import { HttpResponse, http } from 'msw';

export const handlers = [
  http.get('http://localhost/api/ping', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
