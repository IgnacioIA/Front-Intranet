const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

// Fail-fast: sin URL configurada no hay forma segura de asumir un destino (ver .env.example).
if (!apiBaseUrl) {
  throw new Error(
    'VITE_API_BASE_URL no está configurada. Definila en un archivo .env (ver .env.example).',
  )
}

export { apiBaseUrl }
