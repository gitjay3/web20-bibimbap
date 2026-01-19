import { createContext, useContext, type ReactNode } from 'react';
import type { Organization } from '@/api/organization';

interface OrgContextType {
  organization: Organization | null;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({
  children,
  organization,
}: {
  children: ReactNode;
  organization: Organization | null;
}) {
  return <OrgContext.Provider value={{ organization }}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
