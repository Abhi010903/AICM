'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from './types';
import { getRolePreference, setRolePreference } from './demo-store';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: 'president',
  setRole: () => {},
  switchRole: () => {},
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('president');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = getRolePreference();
    if (pathname.startsWith('/citizen')) {
      setRoleState('citizen');
    } else if (pathname.startsWith('/president')) {
      setRoleState('president');
    } else {
      setRoleState(saved);
    }
  }, [pathname]);

  const switchRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setRolePreference(newRole);
    if (newRole === 'president') {
      router.push('/president');
    } else {
      router.push('/citizen');
    }
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole: setRoleState,
        switchRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
