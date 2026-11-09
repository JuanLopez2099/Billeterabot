import { useContext } from 'react';
import { CuentasContext } from './CuentasContext';

export function useCuentas() {
  return useContext(CuentasContext);
}