import { api } from './axios';

export async function executeCommand(command) {
  const { data } = await api.post('/vm/execute', { command });
  return data;
}
