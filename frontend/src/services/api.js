import axios from 'axios'

const api = axios.create({
  baseURL: '', // vite dev server proxy will route /simplex
})

export async function solveSimplex(payload) {
  const { data } = await api.post('/simplex/solve', payload)
  return data
}

export async function getLast() {
  const { data } = await api.get('/simplex/last')
  return data
}

export async function deleteLast(index) {
  const { data } = await api.delete(`/simplex/last/${index}`)
  return data
}

export async function clearLast() {
  const { data } = await api.delete('/simplex/last/clear')
  return data
}