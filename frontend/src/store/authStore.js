// Zustand è una libreria di gestione dello stato per applicazioni React.
// Utilizza un'API di React per gestire lo stato globale dell'applicazione.
// È un'alternativa a React Context e React Redux.
import { create } from "zustand"; // Crea un nuovo store
import axios from "axios"; // Importa la libreria axios

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth"

axios.defaults.withCredentials = true; // Consente di accedere alle risorse dal frontend

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isCheckingAuth: true,
  message: null,

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        name,
      });
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response.data.message || "Errore signing up",
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      set({
        user: response.data.user, // Aggiorna l'utente nello stato
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response.data.message || "Errore logging in",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/logout`);
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error) {
      set({error: "Errore durante il logout", isLoading: false});
      throw error;
    }
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/verify-email`, { code });
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response.data.message || "Errore verificando l'email",
        isLoading: false,
      });
      throw error;
    }
  },

  checkAuth: async () => {
    // await new Promise((resolve) => setTimeout(resolve, 1500)); // Attendi 1,5 secondi
    set({ isCheckingAuth: true, error: null});
    try {
        const response = await axios.get(`${API_URL}/check-auth`);
        set({user: response.data.user, isAuthenticated: true, isCheckingAuth: false});
    } catch (error) {
        set({ error: null, isCheckingAuth: false, isAuthenticated: false });
        throw error; // Se l'utente non è autenticato, restituisco un errore
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, message: null }); // Aggiorna lo stato
    try {
      // Invia la richiesta di reimpostazione della password
      const response = await axios.post(`${API_URL}/forgot-password`, { email }); 
      set({message: response.data.message, isLoading: false}); 
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || "Errore nella richiesta di reimpostazione della password"
      });
      throw error; // Se l'utente non è autenticato, restituisco un errore
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null, message: null }); // Aggiorna lo stato
    try {
      // Invia la richiesta di reimpostazione della password
      const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
      set({message: response.data.message, isLoading: false}); 
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || "Errore nella richiesta di reimpostazione della password"
      });
      throw error; // Se l'utente non è autenticato, restituisco un errore
    }
  }
}));
