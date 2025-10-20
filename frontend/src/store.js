import { create } from 'zustand'

export const useLPStore = create((set) => ({
  request: null,
  result: null,
  setRequest: (req) => set({ request: req }),
  setResult: (res) => set({ result: res }),
}))
