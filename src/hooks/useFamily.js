import { useContext } from 'react';
import { FamilyContext } from '../context/FamilyContext';

export function useFamily() {
  return useContext(FamilyContext);
}
