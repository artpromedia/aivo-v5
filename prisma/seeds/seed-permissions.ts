/**
 * Seed script for Role-Permission mappings
 * 
 * This script initializes all permissions and their role mappings
 * based on the permission matrix defined in @aivo/types
 * 
 * Run with: pnpm tsx prisma/seeds/seed-permissions.ts
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Permission definitions (matching @aivo/types)
const PERMISSION_INFO: Record<string, { name: string; description: string; category: string }> = {
  // Platform permissions
  manage_platform: { name: "Manage Platform", description: "Full platform configuration and settings", category: "platform" },
  manage_ai_providers: { name: "Manage AI Providers", description: "Configure and manage AI/LLM providers", category: "platform" },
  manage_billing: { name: "Manage Billing", description: "Handle billing, subscriptions, and invoices", category: "platform" },
  manage_compliance: { name: "Manage Compliance", description: "Compliance audits and legal oversight", category: "platform" },
  view_platform_analytics: { name: "View Platform Analytics", description: "Access platform-wide analytics and metrics", category: "platform" },
  manage_support_tickets: { name: "Manage Support Tickets", description: "Handle technical support requests", category: "platform" },
  
  // Organization permissions
  manage_district: { name: "Manage District", description: "District-level configuration and schools", category: "organization" },
  manage_school: { name: "Manage School", description: "School-level configuration and staff", category: "organization" },
  manage_teachers: { name: "Manage Teachers", description: "Teacher account creation and management", category: "organization" },
  manage_therapists: { name: "Manage Therapists", description: "Therapist account creation and management", category: "organization" },
  manage_parents: { name: "Manage Parents", description: "Parent account creation and management", category: "organization" },
  manage_students: { name: "Manage Students", description: "Student enrollment and profile management", category: "organization" },
  
  // Educational permissions
  manage_curriculum: { name: "Manage Curriculum", description: "Configure curriculum and learning paths", category: "education" },
  manage_classes: { name: "Manage Classes", description: "Create and manage class sections", category: "education" },
  manage_iep: { name: "Manage IEP", description: "Create and manage IEP goals and plans", category: "education" },
  assign_accommodations: { name: "Assign Accommodations", description: "Assign learning accommodations to students", category: "education" },
  view_student_data: { name: "View Student Data", description: "Access student information and records", category: "education" },
  view_child: { name: "View Child", description: "Parent view of their own child's data", category: "education" },
  
  // Analytics permissions
  view_analytics: { name: "View Analytics", description: "General analytics dashboard access", category: "analytics" },
  view_district_analytics: { name: "View District Analytics", description: "District-wide analytics and reports", category: "analytics" },
  view_school_analytics: { name: "View School Analytics", description: "School-wide analytics and reports", category: "analytics" },
  view_class_analytics: { name: "View Class Analytics", description: "Classroom-level analytics", category: "analytics" },
  export_data: { name: "Export Data", description: "Export reports and data", category: "analytics" },
  
  // Learning permissions
  learn: { name: "Learn", description: "Access learning content and activities", category: "learning" },
  take_assessments: { name: "Take Assessments", description: "Participate in assessments", category: "learning" },
  view_own_progress: { name: "View Own Progress", description: "View personal learning progress", category: "learning" },
  
  // Communication permissions
  send_messages: { name: "Send Messages", description: "Send messages to other users", category: "communication" },
  create_announcements: { name: "Create Announcements", description: "Create and publish announcements", category: "communication" },
  schedule_meetings: { name: "Schedule Meetings", description: "Schedule parent-teacher meetings", category: "communication" },
  
  // Content permissions
  create_content: { name: "Create Content", description: "Create educational content items", category: "content" },
  approve_content: { name: "Approve Content", description: "Review and approve content changes", category: "content" },
  view_content: { name: "View Content", description: "View educational content library", category: "content" }
};

// Role-permission mappings
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.keys(PERMISSION_INFO), // All permissions
  
  GLOBAL_ADMIN: [
    "manage_platform", "manage_ai_providers", "manage_compliance", "view_platform_analytics",
    "manage_support_tickets", "manage_district", "manage_school", "manage_teachers",
    "manage_therapists", "manage_parents", "manage_students", "manage_curriculum",
    "manage_classes", "view_student_data", "view_analytics", "view_district_analytics",
    "view_school_analytics", "view_class_analytics", "export_data", "send_messages",
    "create_announcements", "approve_content", "view_content"
  ],
  
  FINANCE_ADMIN: [
    "manage_billing", "view_platform_analytics", "view_analytics", "export_data",
    "send_messages", "view_content"
  ],
  
  TECH_SUPPORT: [
    "manage_support_tickets", "view_platform_analytics", "view_analytics",
    "send_messages", "view_content"
  ],
  
  LEGAL_COMPLIANCE: [
    "manage_compliance", "view_platform_analytics", "view_analytics",
    "view_district_analytics", "view_school_analytics", "export_data", "view_content"
  ],
  
  DISTRICT_ADMIN: [
    "manage_district", "manage_school", "manage_teachers", "manage_therapists",
    "manage_parents", "manage_students", "manage_curriculum", "manage_classes",
    "view_student_data", "view_analytics", "view_district_analytics",
    "view_school_analytics", "view_class_analytics", "export_data", "send_messages",
    "create_announcements", "schedule_meetings", "approve_content", "view_content"
  ],
  
  SCHOOL_ADMIN: [
    "manage_school", "manage_teachers", "manage_therapists", "manage_parents",
    "manage_students", "manage_classes", "view_student_data", "view_analytics",
    "view_school_analytics", "view_class_analytics", "export_data", "send_messages",
    "create_announcements", "schedule_meetings", "view_content"
  ],
  
  TEACHER: [
    "manage_classes", "manage_iep", "assign_accommodations", "view_student_data",
    "view_analytics", "view_class_analytics", "send_messages", "create_announcements",
    "schedule_meetings", "create_content", "view_content"
  ],
  
  THERAPIST: [
    "manage_iep", "assign_accommodations", "view_student_data", "view_analytics",
    "send_messages", "schedule_meetings", "view_content"
  ],
  
  PARENT: [
    "view_child", "view_own_progress", "send_messages", "schedule_meetings", "view_content"
  ],
  
  LEARNER: [
    "learn", "take_assessments", "view_own_progress", "send_messages", "view_content"
  ]
};

async function main() {
  console.log("🔐 Seeding permissions and role mappings...\n");

  // Step 1: Create all permissions
  console.log("📝 Creating permissions...");
  const permissionCodes = Object.keys(PERMISSION_INFO);
  
  for (const code of permissionCodes) {
    const info = PERMISSION_INFO[code];
    
    await prisma.permission.upsert({
      where: { code },
      create: {
        code,
        name: info.name,
        description: info.description,
        category: info.category
      },
      update: {
        name: info.name,
        description: info.description,
        category: info.category
      }
    });
    
    console.log(`  ✓ ${code}`);
  }
  
  console.log(`\n✅ Created ${permissionCodes.length} permissions\n`);

  // Step 2: Map permissions to roles
  console.log("🔗 Mapping permissions to roles...");
  
  const roleNames = Object.keys(ROLE_PERMISSIONS);
  let totalMappings = 0;
  
  for (const roleName of roleNames) {
    const permissions = ROLE_PERMISSIONS[roleName];
    const role = roleName as Role;
    
    console.log(`\n  ${roleName} (${permissions.length} permissions):`);
    
    // Clear existing mappings for this role
    await prisma.rolePermission.deleteMany({
      where: { role }
    });
    
    // Create new mappings
    for (const permissionCode of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode }
      });
      
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            role,
            permissionId: permission.id
          }
        });
        totalMappings++;
      } else {
        console.log(`    ⚠️ Permission not found: ${permissionCode}`);
      }
    }
    
    console.log(`    ✓ ${permissions.length} permissions assigned`);
  }
  
  console.log(`\n✅ Created ${totalMappings} role-permission mappings\n`);

  // Step 3: Print summary
  console.log("📊 Summary by category:");
  const categories = [...new Set(permissionCodes.map(p => PERMISSION_INFO[p].category))];
  
  for (const category of categories) {
    const count = permissionCodes.filter(p => PERMISSION_INFO[p].category === category).length;
    console.log(`  ${category}: ${count} permissions`);
  }
  
  console.log("\n📊 Summary by role:");
  for (const roleName of roleNames) {
    const count = ROLE_PERMISSIONS[roleName].length;
    console.log(`  ${roleName}: ${count} permissions`);
  }
  
  console.log("\n🎉 Permissions seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding permissions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
