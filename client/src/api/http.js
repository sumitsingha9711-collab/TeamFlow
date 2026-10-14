const csrf = () =>
  document.cookie
    .split('; ')
    .find((item) => item.startsWith('teamflow_csrf='))
    ?.split('=')[1] || '';
export async function api(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrf(),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Request failed.');
  return data;
}
