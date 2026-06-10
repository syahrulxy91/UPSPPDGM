import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { isAllowedPpdgmEmail } from "../../features/auth/utils/emailValidator";

export type UserRole = "superadmin" | "pegawai_ppd" | "penyemak" | "viewer";

export interface RolePermissions {
  canCreateBorang: boolean;
  canSubmitBorang: boolean;
  canUpdateBorangStatus: boolean; // eg, Lulus / Tolak
  canUpdateBorangRecord: boolean; // eg, Edit/Update draft
  canViewAuditLogs: boolean;
  canExportReports: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  superadmin: {
    canCreateBorang: true,
    canSubmitBorang: true,
    canUpdateBorangStatus: true,
    canUpdateBorangRecord: true,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  pegawai_ppd: {
    canCreateBorang: true,
    canSubmitBorang: true,
    canUpdateBorangStatus: false,
    canUpdateBorangRecord: true,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  penyemak: {
    canCreateBorang: false,
    canSubmitBorang: false,
    canUpdateBorangStatus: true,
    canUpdateBorangRecord: false,
    canViewAuditLogs: true,
    canExportReports: true,
  },
  viewer: {
    canCreateBorang: false,
    canSubmitBorang: false,
    canUpdateBorangStatus: false,
    canUpdateBorangRecord: false,
    canViewAuditLogs: false,
    canExportReports: false,
  },
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  permissions: RolePermissions;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("superadmin");
  const [userEmail, setUserEmailState] = useState<string>("syahrulxy91@gmail.com");

  // Load from local storage or detect from Firebase auth on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("sps_uat_active_role") as UserRole;
    const savedEmail = localStorage.getItem("sps_uat_active_email");

    if (savedRole) {
      setRoleState(savedRole);
    } else {
      // Determine default based on Firebase User Email (if loaded) or default metadata email
      const currentUserEmail = auth.currentUser?.email || "syahrulxy91@gmail.com";
      if (currentUserEmail === "syahrulxy91@gmail.com") {
        setRoleState("superadmin");
      } else if (isAllowedPpdgmEmail(currentUserEmail)) {
        setRoleState("pegawai_ppd");
      } else {
        setRoleState("viewer");
      }
    }

    if (savedEmail) {
      setUserEmailState(savedEmail);
    } else {
      const currentUserEmail = auth.currentUser?.email || "syahrulxy91@gmail.com";
      setUserEmailState(currentUserEmail);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("sps_uat_active_role", newRole);
  };

  const setUserEmail = async (newEmail: string) => {
    setUserEmailState(newEmail);
    localStorage.setItem("sps_uat_active_email", newEmail);
    
    // Auto align default role if email shifts to match expectations
    let nextRole: UserRole = "viewer";
    if (newEmail === "syahrulxy91@gmail.com") {
      nextRole = "superadmin";
    } else if (isAllowedPpdgmEmail(newEmail)) {
      nextRole = "pegawai_ppd";
    }
    setRoleState(nextRole);
    localStorage.setItem("sps_uat_active_role", nextRole);
  };

  const permissions = ROLE_PERMISSIONS[role];

  return (
    <RoleContext.Provider value={{ role, setRole, userEmail, setUserEmail, permissions }}>
      {children}
    </RoleContext.Provider>
  );
}

/**
 * Central permission-checking utility for RBAC.
 */
export function hasPermission(role: UserRole, permissionKey: keyof RolePermissions): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? !!perms[permissionKey] : false;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  
  // Custom helper on top of standard permissions object
  const can = (permissionKey: keyof RolePermissions): boolean => {
    return hasPermission(context.role, permissionKey);
  };

  return {
    ...context,
    can,
  };
}
