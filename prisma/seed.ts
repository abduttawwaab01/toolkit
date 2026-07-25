import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("successor", 12);
  await prisma.user.upsert({
    where: { email: "admin@skoolar.org" },
    update: { passwordHash, name: "Admin", role: "ADMIN", creditsBalance: 999999, storageLimit: BigInt("1099511627776") },
    create: { email: "admin@skoolar.org", passwordHash, name: "Admin", role: "ADMIN", creditsBalance: 999999, storageLimit: BigInt("1099511627776") },
  });

  for (const role of ["GUEST", "USER", "ADMIN"]) {
    await prisma.autoDeleteConfig.upsert({
      where: { role },
      update: {},
      create: {
        role,
        tempTtlHours: role === "GUEST" ? 1 : role === "USER" ? 6 : 48,
        processedTtlHours: role === "GUEST" ? 24 : role === "USER" ? 168 : 2160,
        exportTtlHours: role === "GUEST" ? 168 : role === "USER" ? 720 : 8760,
        enabled: true,
      },
    });

    const exportLimits: Record<string, Record<string, number>> = {
      GUEST: { freePerDay: 1, freePerWeek: 3, freePerMonth: 5, freePerYear: 30, creditsPerExport: 2, creditsPerMinute: 2 },
      USER: { freePerDay: 3, freePerWeek: 15, freePerMonth: 50, freePerYear: 500, creditsPerExport: 1, creditsPerMinute: 1 },
      ADMIN: { freePerDay: 9999, freePerWeek: 9999, freePerMonth: 9999, freePerYear: 9999, creditsPerExport: 0, creditsPerMinute: 0 },
    };
    const docLimits: Record<string, Record<string, any>> = {
      GUEST: { maxDocuments: 5, maxDocumentSizeKB: 1024, allowedDocFormats: '["txt","md","html"]' },
      USER: { maxDocuments: 50, maxDocumentSizeKB: 5120, allowedDocFormats: '["txt","md","html","pdf","docx","rtf"]' },
      ADMIN: { maxDocuments: 99999, maxDocumentSizeKB: 102400, allowedDocFormats: '["txt","md","html","pdf","docx","rtf"]' },
    };
    const exportLabels: Record<string, string> = { freePerDay: "Free Exports Per Day", freePerWeek: "Free Exports Per Week", freePerMonth: "Free Exports Per Month", freePerYear: "Free Exports Per Year", creditsPerExport: "Credits Per Export", creditsPerMinute: "Credits Per Minute" };
    const docLabels: Record<string, string> = { maxDocuments: "Max Documents", maxDocumentSizeKB: "Max Document Size (KB)", allowedDocFormats: "Allowed Document Formats" };

    for (const [field, value] of Object.entries(exportLimits[role])) {
      const key = `export_limit_${role}_${field}`;
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), label: `${role} - ${exportLabels[field]}`, category: "export-limits", type: "number" },
      });
    }
    for (const [field, value] of Object.entries(docLimits[role])) {
      const key = `doc_limit_${role}_${field}`;
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), label: `${role} - ${docLabels[field]}`, category: "documents", type: field === "allowedDocFormats" ? "string" : "number" },
      });
    }
  }

  const features = [
    { key: "ai-video-editing", label: "AI Video Editing", enabled: true, roles: '["ADMIN","USER","GUEST"]' },
    { key: "ai-audio-studio", label: "AI Audio Studio", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "voice-cloning", label: "Voice Cloning", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "guest-uploads", label: "Guest Uploads", enabled: true, roles: '["ADMIN"]' },
    { key: "white-label", label: "White Label", enabled: false, roles: '["ADMIN"]' },
    { key: "ai-image-tools", label: "AI Image Tools", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "ai-copilot", label: "AI Co-Pilot", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "export-4k", label: "4K Export", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "team-collaboration", label: "Team Collaboration", enabled: false, roles: '["ADMIN"]' },
    { key: "api-access", label: "API Access", enabled: false, roles: '["ADMIN"]' },
    { key: "document-editor", label: "Document Editor", enabled: true, roles: '["ADMIN","USER","GUEST"]' },
    { key: "document-converter", label: "Document Converter", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "document-templates", label: "Document Templates", enabled: true, roles: '["ADMIN","USER"]' },
    { key: "document-export", label: "Document Export", enabled: true, roles: '["ADMIN","USER","GUEST"]' },
  ];

  for (const f of features) {
    await prisma.featureToggle.upsert({ where: { key: f.key }, update: {}, create: f });
  }

  // Seed bank details
  await prisma.bankDetail.upsert({
    where: { id: "default-bank" },
    update: {},
    create: {
      id: "default-bank",
      accountName: "Odebunmi Tawwab",
      accountNo: "9033460322",
      bankName: "Palmpay",
      isActive: true,
    },
  });

  // Seed credit packages — ₦500 per credit default
  const packages = [
    { id: "pkg-5", name: "Starter", credits: 5, priceNaira: 2500, bonusCredits: 0, description: "5 credits for occasional use", sortOrder: 1 },
    { id: "pkg-15", name: "Popular", credits: 15, priceNaira: 6000, bonusCredits: 2, description: "15 credits + 2 bonus — most popular", sortOrder: 2 },
    { id: "pkg-30", name: "Value", credits: 30, priceNaira: 10000, bonusCredits: 5, description: "30 credits + 5 bonus — best value", sortOrder: 3 },
    { id: "pkg-100", name: "Business", credits: 100, priceNaira: 30000, bonusCredits: 20, description: "100 credits + 20 bonus — for heavy users", sortOrder: 4 },
  ];

  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: { ...pkg, isActive: true },
    });
  }

  console.log("✅ Seeded: admin user, auto-delete configs, export limits, document settings, feature toggles, bank details, credit packages.");
  console.log(`   Admin: admin@skoolar.org / successor`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
