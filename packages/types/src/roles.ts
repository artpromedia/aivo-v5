/**
 * AIVO v5 Role-Based Access Control (RBAC) Types
 * 
 * This module defines the complete role hierarchy and permission system
 * supporting all 11 roles from the legacy platform.
 */

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * All available roles in the AIVO platform
 * Organized by hierarchy level
 */
export type Role =
  // Platform-level roles (highest privilege)
  | "SUPER_ADMIN"       // Full platform access - can do everything
  | "GLOBAL_ADMIN"      // Platform operations management
  | "FINANCE_ADMIN"     // Billing & financial management only
  | "TECH_SUPPORT"      // Technical support staff
  | "LEGAL_COMPLIANCE"  // Compliance & legal oversight
  
  // Organizational roles (tenant/district/school level)
  | "DISTRICT_ADMIN"    // District-level management
  | "SCHOOL_ADMIN"      // School-level management
  
  // Educational roles (classroom/learner level)
  | "TEACHER"           // Classroom teacher
  | "THERAPIST"         // Specialized therapist (speech, OT, etc.)
  | "PARENT"            // Parent/guardian
  | "LEARNER";          // Student/child

/**
 * Role display information for UI rendering
 */
export interface RoleInfo {
  role: Role;
  displayName: string;
  description: string;
  level: "platform" | "organization" | "education";
  icon?: string;
}

/**
 * Complete role information map
 */
export const ROLE_INFO: Record<Role, RoleInfo> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Full platform access with all permissions",
    level: "platform",
    icon: "shield-check"
  },
  GLOBAL_ADMIN: {
    role: "GLOBAL_ADMIN",
    displayName: "Global Administrator",
    description: "Platform operations and management",
    level: "platform",
    icon: "globe"
  },
  FINANCE_ADMIN: {
    role: "FINANCE_ADMIN",
    displayName: "Finance Administrator",
    description: "Billing and financial management",
    level: "platform",
    icon: "currency-dollar"
  },
  TECH_SUPPORT: {
    role: "TECH_SUPPORT",
    displayName: "Technical Support",
    description: "Technical support and troubleshooting",
    level: "platform",
    icon: "wrench-screwdriver"
  },
  LEGAL_COMPLIANCE: {
    role: "LEGAL_COMPLIANCE",
    displayName: "Legal & Compliance",
    description: "Legal oversight and compliance management",
    level: "platform",
    icon: "scale"
  },
  DISTRICT_ADMIN: {
    role: "DISTRICT_ADMIN",
    displayName: "District Administrator",
    description: "District-level school management",
    level: "organization",
    icon: "building-office-2"
  },
  SCHOOL_ADMIN: {
    role: "SCHOOL_ADMIN",
    displayName: "School Administrator",
    description: "School-level management",
    level: "organization",
    icon: "academic-cap"
  },
  TEACHER: {
    role: "TEACHER",
    displayName: "Teacher",
    description: "Classroom instruction and student management",
    level: "education",
    icon: "user-group"
  },
  THERAPIST: {
    role: "THERAPIST",
    displayName: "Therapist",
    description: "Specialized therapy and IEP management",
    level: "education",
    icon: "heart"
  },
  PARENT: {
    role: "PARENT",
    displayName: "Parent/Guardian",
    description: "View child progress and communicate with educators",
    level: "education",
    icon: "home"
  },
  LEARNER: {
    role: "LEARNER",
    displayName: "Learner",
    description: "Student learning experience",
    level: "education",
    icon: "user"
  }
};

// ============================================================================
// ROLE HIERARCHY
// ============================================================================

/**
 * Role hierarchy levels (lower number = higher privilege)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 0,
  GLOBAL_ADMIN: 1,
  FINANCE_ADMIN: 2,
  TECH_SUPPORT: 2,
  LEGAL_COMPLIANCE: 2,
  DISTRICT_ADMIN: 3,
  SCHOOL_ADMIN: 4,
  TEACHER: 5,
  THERAPIST: 5,
  PARENT: 6,
  LEARNER: 7
};

/**
 * Check if a role has authority over another role
 */
export function hasRoleAuthority(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY[targetRole];
}

/**
 * Get all roles that a given role can manage
 */
export function getManageableRoles(role: Role): Role[] {
  const level = ROLE_HIERARCHY[role];
  return (Object.entries(ROLE_HIERARCHY) as [Role, number][])
    .filter(([_, roleLevel]) => roleLevel > level)
    .map(([r]) => r);
}

/**
 * Check if role is a platform-level role
 */
export function isPlatformRole(role: Role): boolean {
  return ["SUPER_ADMIN", "GLOBAL_ADMIN", "FINANCE_ADMIN", "TECH_SUPPORT", "LEGAL_COMPLIANCE"].includes(role);
}

/**
 * Check if role is an organizational role
 */
export function isOrganizationalRole(role: Role): boolean {
  return ["DISTRICT_ADMIN", "SCHOOL_ADMIN"].includes(role);
}

/**
 * Check if role is an educational role
 */
export function isEducationalRole(role: Role): boolean {
  return ["TEACHER", "THERAPIST", "PARENT", "LEARNER"].includes(role);
}

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * All available permissions in the system
 */
export type Permission =
  // Platform permissions
  | "manage_platform"        // Full platform configuration
  | "manage_ai_providers"    // Configure AI providers
  | "manage_billing"         // Handle billing and subscriptions
  | "manage_compliance"      // Compliance and audit management
  | "view_platform_analytics" // View platform-wide analytics
  | "manage_support_tickets" // Handle support requests
  
  // Organization permissions
  | "manage_district"        // District-level management
  | "manage_school"          // School-level management
  | "manage_teachers"        // Teacher account management
  | "manage_therapists"      // Therapist account management
  | "manage_parents"         // Parent account management
  | "manage_students"        // Student enrollment
  
  // Educational permissions
  | "manage_curriculum"      // Curriculum configuration
  | "manage_classes"         // Class and section management
  | "manage_iep"             // IEP/accommodation management
  | "assign_accommodations"  // Assign learner accommodations
  | "view_student_data"      // View student information
  | "view_child"             // Parent view of their child
  
  // Analytics permissions
  | "view_analytics"         // General analytics access
  | "view_district_analytics" // District-level analytics
  | "view_school_analytics"  // School-level analytics
  | "view_class_analytics"   // Classroom analytics
  | "export_data"            // Export data/reports
  
  // Learning permissions
  | "learn"                  // Access learning content
  | "take_assessments"       // Take baseline/progress assessments
  | "view_own_progress"      // View own learning progress
  
  // Communication permissions
  | "send_messages"          // Send platform messages
  | "create_announcements"   // Create announcements
  | "schedule_meetings"      // Schedule parent-teacher meetings
  
  // Content permissions
  | "create_content"         // Create educational content
  | "approve_content"        // Approve content changes
  | "view_content";          // View educational content

/**
 * Permission information for UI and documentation
 */
export interface PermissionInfo {
  code: Permission;
  name: string;
  description: string;
  category: "platform" | "organization" | "education" | "analytics" | "learning" | "communication" | "content";
}

/**
 * Complete permission information map
 */
export const PERMISSION_INFO: Record<Permission, PermissionInfo> = {
  // Platform permissions
  manage_platform: {
    code: "manage_platform",
    name: "Manage Platform",
    description: "Full platform configuration and settings",
    category: "platform"
  },
  manage_ai_providers: {
    code: "manage_ai_providers",
    name: "Manage AI Providers",
    description: "Configure and manage AI/LLM providers",
    category: "platform"
  },
  manage_billing: {
    code: "manage_billing",
    name: "Manage Billing",
    description: "Handle billing, subscriptions, and invoices",
    category: "platform"
  },
  manage_compliance: {
    code: "manage_compliance",
    name: "Manage Compliance",
    description: "Compliance audits and legal oversight",
    category: "platform"
  },
  view_platform_analytics: {
    code: "view_platform_analytics",
    name: "View Platform Analytics",
    description: "Access platform-wide analytics and metrics",
    category: "platform"
  },
  manage_support_tickets: {
    code: "manage_support_tickets",
    name: "Manage Support Tickets",
    description: "Handle technical support requests",
    category: "platform"
  },

  // Organization permissions
  manage_district: {
    code: "manage_district",
    name: "Manage District",
    description: "District-level configuration and schools",
    category: "organization"
  },
  manage_school: {
    code: "manage_school",
    name: "Manage School",
    description: "School-level configuration and staff",
    category: "organization"
  },
  manage_teachers: {
    code: "manage_teachers",
    name: "Manage Teachers",
    description: "Teacher account creation and management",
    category: "organization"
  },
  manage_therapists: {
    code: "manage_therapists",
    name: "Manage Therapists",
    description: "Therapist account creation and management",
    category: "organization"
  },
  manage_parents: {
    code: "manage_parents",
    name: "Manage Parents",
    description: "Parent account creation and management",
    category: "organization"
  },
  manage_students: {
    code: "manage_students",
    name: "Manage Students",
    description: "Student enrollment and profile management",
    category: "organization"
  },

  // Educational permissions
  manage_curriculum: {
    code: "manage_curriculum",
    name: "Manage Curriculum",
    description: "Configure curriculum and learning paths",
    category: "education"
  },
  manage_classes: {
    code: "manage_classes",
    name: "Manage Classes",
    description: "Create and manage class sections",
    category: "education"
  },
  manage_iep: {
    code: "manage_iep",
    name: "Manage IEP",
    description: "Create and manage IEP goals and plans",
    category: "education"
  },
  assign_accommodations: {
    code: "assign_accommodations",
    name: "Assign Accommodations",
    description: "Assign learning accommodations to students",
    category: "education"
  },
  view_student_data: {
    code: "view_student_data",
    name: "View Student Data",
    description: "Access student information and records",
    category: "education"
  },
  view_child: {
    code: "view_child",
    name: "View Child",
    description: "Parent view of their own child's data",
    category: "education"
  },

  // Analytics permissions
  view_analytics: {
    code: "view_analytics",
    name: "View Analytics",
    description: "General analytics dashboard access",
    category: "analytics"
  },
  view_district_analytics: {
    code: "view_district_analytics",
    name: "View District Analytics",
    description: "District-wide analytics and reports",
    category: "analytics"
  },
  view_school_analytics: {
    code: "view_school_analytics",
    name: "View School Analytics",
    description: "School-wide analytics and reports",
    category: "analytics"
  },
  view_class_analytics: {
    code: "view_class_analytics",
    name: "View Class Analytics",
    description: "Classroom-level analytics",
    category: "analytics"
  },
  export_data: {
    code: "export_data",
    name: "Export Data",
    description: "Export reports and data",
    category: "analytics"
  },

  // Learning permissions
  learn: {
    code: "learn",
    name: "Learn",
    description: "Access learning content and activities",
    category: "learning"
  },
  take_assessments: {
    code: "take_assessments",
    name: "Take Assessments",
    description: "Participate in assessments",
    category: "learning"
  },
  view_own_progress: {
    code: "view_own_progress",
    name: "View Own Progress",
    description: "View personal learning progress",
    category: "learning"
  },

  // Communication permissions
  send_messages: {
    code: "send_messages",
    name: "Send Messages",
    description: "Send messages to other users",
    category: "communication"
  },
  create_announcements: {
    code: "create_announcements",
    name: "Create Announcements",
    description: "Create and publish announcements",
    category: "communication"
  },
  schedule_meetings: {
    code: "schedule_meetings",
    name: "Schedule Meetings",
    description: "Schedule parent-teacher meetings",
    category: "communication"
  },

  // Content permissions
  create_content: {
    code: "create_content",
    name: "Create Content",
    description: "Create educational content items",
    category: "content"
  },
  approve_content: {
    code: "approve_content",
    name: "Approve Content",
    description: "Review and approve content changes",
    category: "content"
  },
  view_content: {
    code: "view_content",
    name: "View Content",
    description: "View educational content library",
    category: "content"
  }
};

// ============================================================================
// ROLE-PERMISSION MATRIX
// ============================================================================

/**
 * Default permissions for each role
 * This is the source of truth for the permission matrix
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // Super admin has ALL permissions
    "manage_platform",
    "manage_ai_providers",
    "manage_billing",
    "manage_compliance",
    "view_platform_analytics",
    "manage_support_tickets",
    "manage_district",
    "manage_school",
    "manage_teachers",
    "manage_therapists",
    "manage_parents",
    "manage_students",
    "manage_curriculum",
    "manage_classes",
    "manage_iep",
    "assign_accommodations",
    "view_student_data",
    "view_child",
    "view_analytics",
    "view_district_analytics",
    "view_school_analytics",
    "view_class_analytics",
    "export_data",
    "learn",
    "take_assessments",
    "view_own_progress",
    "send_messages",
    "create_announcements",
    "schedule_meetings",
    "create_content",
    "approve_content",
    "view_content"
  ],

  GLOBAL_ADMIN: [
    "manage_platform",
    "manage_ai_providers",
    "manage_compliance",
    "view_platform_analytics",
    "manage_support_tickets",
    "manage_district",
    "manage_school",
    "manage_teachers",
    "manage_therapists",
    "manage_parents",
    "manage_students",
    "manage_curriculum",
    "manage_classes",
    "view_student_data",
    "view_analytics",
    "view_district_analytics",
    "view_school_analytics",
    "view_class_analytics",
    "export_data",
    "send_messages",
    "create_announcements",
    "approve_content",
    "view_content"
  ],

  FINANCE_ADMIN: [
    "manage_billing",
    "view_platform_analytics",
    "view_analytics",
    "export_data",
    "send_messages",
    "view_content"
  ],

  TECH_SUPPORT: [
    "manage_support_tickets",
    "view_platform_analytics",
    "view_analytics",
    "send_messages",
    "view_content"
  ],

  LEGAL_COMPLIANCE: [
    "manage_compliance",
    "view_platform_analytics",
    "view_analytics",
    "view_district_analytics",
    "view_school_analytics",
    "export_data",
    "view_content"
  ],

  DISTRICT_ADMIN: [
    "manage_district",
    "manage_school",
    "manage_teachers",
    "manage_therapists",
    "manage_parents",
    "manage_students",
    "manage_curriculum",
    "manage_classes",
    "view_student_data",
    "view_analytics",
    "view_district_analytics",
    "view_school_analytics",
    "view_class_analytics",
    "export_data",
    "send_messages",
    "create_announcements",
    "schedule_meetings",
    "approve_content",
    "view_content"
  ],

  SCHOOL_ADMIN: [
    "manage_school",
    "manage_teachers",
    "manage_therapists",
    "manage_parents",
    "manage_students",
    "manage_classes",
    "view_student_data",
    "view_analytics",
    "view_school_analytics",
    "view_class_analytics",
    "export_data",
    "send_messages",
    "create_announcements",
    "schedule_meetings",
    "view_content"
  ],

  TEACHER: [
    "manage_classes",
    "manage_iep",
    "assign_accommodations",
    "view_student_data",
    "view_analytics",
    "view_class_analytics",
    "send_messages",
    "create_announcements",
    "schedule_meetings",
    "create_content",
    "view_content"
  ],

  THERAPIST: [
    "manage_iep",
    "assign_accommodations",
    "view_student_data",
    "view_analytics",
    "send_messages",
    "schedule_meetings",
    "view_content"
  ],

  PARENT: [
    "view_child",
    "view_own_progress",
    "send_messages",
    "schedule_meetings",
    "view_content"
  ],

  LEARNER: [
    "learn",
    "take_assessments",
    "view_own_progress",
    "send_messages",
    "view_content"
  ]
};

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(permission: Permission): Role[] {
  return (Object.entries(ROLE_PERMISSIONS) as [Role, Permission[]][])
    .filter(([_, permissions]) => permissions.includes(permission))
    .map(([role]) => role);
}

// ============================================================================
// ROLE ASSIGNMENT TYPES
// ============================================================================

/**
 * Role assignment with scope (tenant/district/school)
 */
export interface RoleAssignment {
  userId: string;
  role: Role;
  tenantId?: string;
  districtId?: string;
  schoolId?: string;
  assignedAt: string;
  assignedBy?: string;
}

/**
 * User with their role assignments and computed permissions
 */
export interface UserWithPermissions {
  id: string;
  email?: string;
  name?: string;
  primaryRole: Role;
  roleAssignments: RoleAssignment[];
  permissions: Permission[];
}

/**
 * Role change audit entry
 */
export interface RoleChangeAuditEntry {
  id: string;
  userId: string;
  changedBy: string;
  oldRole?: Role;
  newRole: Role;
  tenantId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// SCOPE-BASED ACCESS
// ============================================================================

/**
 * Access scope for role-based filtering
 */
export interface AccessScope {
  tenantId?: string;
  districtId?: string;
  schoolId?: string;
  classIds?: string[];
  learnerIds?: string[];
}

/**
 * Get access scope based on role and assignments
 */
export function getAccessScope(role: Role, assignment?: RoleAssignment): AccessScope {
  // Platform roles have no scope restrictions
  if (isPlatformRole(role)) {
    return {};
  }

  if (!assignment) {
    return {};
  }

  switch (role) {
    case "DISTRICT_ADMIN":
      return {
        tenantId: assignment.tenantId,
        districtId: assignment.districtId
      };
    case "SCHOOL_ADMIN":
      return {
        tenantId: assignment.tenantId,
        districtId: assignment.districtId,
        schoolId: assignment.schoolId
      };
    case "TEACHER":
    case "THERAPIST":
      return {
        tenantId: assignment.tenantId,
        districtId: assignment.districtId,
        schoolId: assignment.schoolId
        // classIds and learnerIds would be populated from class assignments
      };
    case "PARENT":
      return {
        tenantId: assignment.tenantId
        // learnerIds would be populated from guardian relationships
      };
    case "LEARNER":
      return {
        tenantId: assignment.tenantId,
        schoolId: assignment.schoolId
      };
    default:
      return {};
  }
}

// ============================================================================
// NAVIGATION/UI HELPERS
// ============================================================================

/**
 * Navigation item visibility by role
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredPermissions?: Permission[];
  allowedRoles?: Role[];
}

/**
 * Filter navigation items based on user's role
 */
export function filterNavItems(items: NavItem[], role: Role): NavItem[] {
  return items.filter(item => {
    // Check role allowlist
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (!item.allowedRoles.includes(role)) {
        return false;
      }
    }

    // Check required permissions
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (!hasAnyPermission(role, item.requiredPermissions)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get dashboard route for a role
 */
export function getDashboardRoute(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "GLOBAL_ADMIN":
      return "/platform-admin";
    case "FINANCE_ADMIN":
      return "/platform-admin/billing";
    case "TECH_SUPPORT":
      return "/platform-admin/support";
    case "LEGAL_COMPLIANCE":
      return "/platform-admin/compliance";
    case "DISTRICT_ADMIN":
      return "/district-admin";
    case "SCHOOL_ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "THERAPIST":
      return "/therapist";
    case "PARENT":
      return "/parent";
    case "LEARNER":
      return "/learn";
    default:
      return "/";
  }
}

// ============================================================================
// LEGACY ROLE MAPPING
// ============================================================================

/**
 * Map legacy role names to new roles
 * Used for migration and backward compatibility
 */
export const LEGACY_ROLE_MAP: Record<string, Role> = {
  // Old v5 roles
  "ADMIN": "SCHOOL_ADMIN",
  "admin": "SCHOOL_ADMIN",
  
  // Legacy platform roles
  "platform_admin": "SUPER_ADMIN",
  "district_admin": "DISTRICT_ADMIN",
  
  // Standard roles (unchanged)
  "teacher": "TEACHER",
  "TEACHER": "TEACHER",
  "parent": "PARENT",
  "PARENT": "PARENT",
  "learner": "LEARNER",
  "LEARNER": "LEARNER",
  "therapist": "THERAPIST",
  "THERAPIST": "THERAPIST"
};

/**
 * Convert a legacy role string to the new Role type
 */
export function normalizeLegacyRole(legacyRole: string): Role {
  return LEGACY_ROLE_MAP[legacyRole] ?? "LEARNER";
}
