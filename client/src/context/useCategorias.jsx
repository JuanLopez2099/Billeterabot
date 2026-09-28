import { useContext } from 'react';
import { CategoriasContext } from './CategoriasContext';

export function useCategorias() {
  return useContext(CategoriasContext);
}