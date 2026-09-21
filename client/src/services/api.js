const API_URL = import.meta.env.VITE_API_URL;

export async function testConnection() {
    const response = await fetch(`${API_URL}/`);

    if(!response.ok) {
        throw new Error('Error al conectar con el servidor');
    }

    return response.text();
}