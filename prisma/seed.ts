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

    const limits: Record<string, any> = {
      GUEST: {
        requestsPerMinute: 10, requestsPerHour: 100, concurrentJobs: 1,
        maxFileSize: BigInt(104857600), maxStoragePerUser: BigInt(104857600),
        maxProjects: 2, maxDurationMinutes: 10, maxResolution: "720p",
        exportQuality: "standard", exportWatermark: true, aiCreditsPerDay: 3,
        maxDocuments: 5, maxDocumentSizeKB: 1024,
        allowedDocFormats: '["txt","md","html"]',
        freeExportsPerDay: 1, freeExportsPerWeek: 3, freeExportsPerMonth: 5, freeExportsPerYear: 30,
        creditsPerExport: 2, creditsPerMinute: 2,
      },
      USER: {
        requestsPerMinute: 60, requestsPerHour: 1000, concurrentJobs: 3,
        maxFileSize: BigInt(524288000), maxStoragePerUser: BigInt(1073741824),
        maxProjects: 25, maxDurationMinutes: 60, maxResolution: "1080p",
        exportQuality: "high", exportWatermark: false, aiCreditsPerDay: 10,
        maxDocuments: 50, maxDocumentSizeKB: 5120,
        allowedDocFormats: '["txt","md","html","pdf","docx","rtf"]',
        freeExportsPerDay: 3, freeExportsPerWeek: 15, freeExportsPerMonth: 50, freeExportsPerYear: 500,
        creditsPerExport: 1, creditsPerMinute: 1,
      },
      ADMIN: {
        requestsPerMinute: 1000, requestsPerHour: 50000, concurrentJobs: 100,
        maxFileSize: BigInt("10737418240"), maxStoragePerUser: BigInt("1099511627776"),
        maxProjects: 9999, maxDurationMinutes: 9999, maxResolution: "8K",
        exportQuality: "lossless", exportWatermark: false, aiCreditsPerDay: 1000,
        maxDocuments: 99999, maxDocumentSizeKB: 102400,
        allowedDocFormats: '["txt","md","html","pdf","docx","rtf"]',
        freeExportsPerDay: 9999, freeExportsPerWeek: 9999, freeExportsPerMonth: 9999, freeExportsPerYear: 9999,
        creditsPerExport: 0, creditsPerMinute: 0,
      },
    };

    await prisma.rateLimitRule.upsert({ where: { role }, update: {}, create: { role, ...limits[role] } });
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

  console.log("✅ Seeded: admin user, auto-delete configs, rate limits, feature toggles, bank details, credit packages.");
  console.log(`   Admin: admin@skoolar.org / successor`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
