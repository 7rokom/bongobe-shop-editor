import { createContext, useContext } from 'react';

const ResellerRefContext = createContext<string | null>(null);

export const useResellerRef = () => useContext(ResellerRefContext);

export default ResellerRefContext;
