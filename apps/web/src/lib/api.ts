const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('cantus_token');
  const headers = new Headers(options.headers);

  if (
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      'Erro ao acessar o servidor.'
    );
  }

  return data;
}
