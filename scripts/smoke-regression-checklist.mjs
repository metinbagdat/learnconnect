#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const PROD_URL = "https://www.egitim.today";
const BASE_URL = (process.env.BASE_URL || PROD_URL).replace(/\/$/, "");

if (BASE_URL === PROD_URL && process.env.ALLOW_PROD !== "1") {
  console.error(
    "ERROR: BASE_URL points to the production site. Re-run with ALLOW_PROD=1 to proceed, " +
      "or set BASE_URL to a staging/local environment."
  );
  process.exit(1);
}

const CHECK_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 45000);
const NAV_INTERACTION_THRESHOLD_MS = 3000;
const PERFORMANCE_THRESHOLD_MS = 3000;

const timestamp = new Date().toISOString();
const timestampForPath = timestamp.replace(/[:.]/g, "-");
const reportDir = path.resolve(process.cwd(), "reports", "smoke-regression", timestampForPath);
const reportJsonPath = path.join(reportDir, "report.json");
const reportMarkdownPath = path.join(reportDir, "report.md");
const authStatePath = path.join(reportDir, "auth-state.json");

const checks = [];
const consoleEntries = [];
const criticalConsoleIssues = [];
const jsCssResponses = [];
const interactionDurations = [];

let createdUser = null;
let desktopGreetingResult = null;
let mobileGreetingResult = null;

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addCheck(section, item, passed, details, evidence = {}) {
  checks.push({
    section,
    item,
    status: passed ? "PASS" : "FAIL",
    details,
    evidence,
  });
}

function dedupeByUrl(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.url)) {
      map.set(item.url, item);
    }
  }
  return [...map.values()];
}

function attachCollectors(page, label) {
  page.on("console", (msg) => {
    const entry = {
      label,
      type: msg.type(),
      text: msg.text(),
    };
    consoleEntries.push(entry);

    const looksCritical =
      entry.type === "error" ||
      /React is undefined|SES_|uncaught exception|uncaught/i.test(entry.text);

    if (looksCritical) {
      criticalConsoleIssues.push(entry);
    }
  });

  page.on("pageerror", (error) => {
    criticalConsoleIssues.push({
      label,
      type: "pageerror",
      text: error?.message || String(error),
    });
  });

  page.on("response", (response) => {
    const url = response.url();
    if (/\.(js|css)(\?|$)/i.test(url)) {
      jsCssResponses.push({
        label,
        url,
        status: response.status(),
      });
    }
  });
}

async function bodyContainsAny(page, strings) {
  return page.evaluate((candidates) => {
    const text = (document.body?.innerText || "").toLowerCase();
    return candidates.some((candidate) => text.includes(candidate.toLowerCase()));
  }, strings);
}

async function horizontalOverflowInfo(page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body?.scrollWidth || 0;
    const innerWidth = window.innerWidth;
    const hasOverflow = docWidth > innerWidth + 1 || bodyWidth > innerWidth + 1;
    return { docWidth, bodyWidth, innerWidth, hasOverflow };
  });
}

async function getGreetingOverflow(page) {
  return page.evaluate(() => {
    const headings = [...document.querySelectorAll("h1")];
    const greeting = headings.find((node) => node.textContent?.includes("Merhaba"));
    if (!greeting) {
      return { exists: false };
    }
    return {
      exists: true,
      text: greeting.textContent?.trim() || "",
      scrollWidth: greeting.scrollWidth,
      clientWidth: greeting.clientWidth,
      overflow: greeting.scrollWidth > greeting.clientWidth + 1,
    };
  });
}

async function saveScreenshot(page, fileName) {
  const fullPath = path.join(reportDir, fileName);
  await page.screenshot({ path: fullPath, fullPage: true });
  return fullPath;
}

function summarizeChecks() {
  const passed = checks.filter((c) => c.status === "PASS").length;
  const failed = checks.filter((c) => c.status === "FAIL").length;
  return {
    total: checks.length,
    passed,
    failed,
  };
}

function groupChecksBySection(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.section)) {
      map.set(item.section, []);
    }
    map.get(item.section).push(item);
  }
  return map;
}

function formatDuration(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }
  return `${Math.round(value)} ms`;
}

function buildMarkdownReport(report) {
  const lines = [];
  lines.push("# egitim.today Smoke & Regression Test Report");
  lines.push("");
  lines.push(`- **Tarih:** ${report.meta.timestamp}`);
  lines.push(`- **Base URL:** ${report.meta.baseUrl}`);
  lines.push(`- **Toplam Süre:** ${formatDuration(report.meta.durationMs)}`);
  lines.push("");
  lines.push("## Özet");
  lines.push("");
  lines.push(`- **Toplam Madde:** ${report.summary.total}`);
  lines.push(`- **Geçen:** ${report.summary.passed}`);
  lines.push(`- **Kalan:** ${report.summary.failed}`);
  lines.push("");

  const grouped = groupChecksBySection(report.checks);
  lines.push("## Checklist Sonuçları");
  lines.push("");
  for (const [section, sectionChecks] of grouped.entries()) {
    lines.push(`### ${section}`);
    lines.push("");
    for (const check of sectionChecks) {
      const mark = check.status === "PASS" ? "x" : " ";
      lines.push(`- [${mark}] **${check.item}**`);
      lines.push(`  - Durum: ${check.status}`);
      lines.push(`  - Detay: ${check.details}`);
      const evidenceKeys = Object.keys(check.evidence || {});
      if (evidenceKeys.length > 0) {
        for (const key of evidenceKeys) {
          lines.push(`  - ${key}: ${check.evidence[key]}`);
        }
      }
    }
    lines.push("");
  }

  lines.push("## Kritik Console / Uncaught Hatalar");
  lines.push("");
  if (report.criticalConsoleIssues.length === 0) {
    lines.push("- Kritik console/page hatası tespit edilmedi.");
  } else {
    for (const issue of report.criticalConsoleIssues.slice(0, 20)) {
      lines.push(`- [${issue.label}] (${issue.type}) ${issue.text}`);
    }
  }
  lines.push("");

  lines.push("## Etkileşim Süreleri");
  lines.push("");
  if (report.interactionDurations.length === 0) {
    lines.push("- Ölçüm yok.");
  } else {
    for (const item of report.interactionDurations) {
      lines.push(`- ${item.name}: ${formatDuration(item.durationMs)}`);
    }
  }
  lines.push("");

  lines.push("## Ana JS/CSS Yanıtları");
  lines.push("");
  if (report.mainAssetResponses.length === 0) {
    lines.push("- Kayıt bulunamadı.");
  } else {
    for (const asset of report.mainAssetResponses.slice(0, 30)) {
      lines.push(`- ${asset.status} ${asset.url}`);
    }
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const runStartedAt = Date.now();
  await fs.mkdir(reportDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    // PRIMARY DESKTOP FLOW: core load + register + dashboard + navigation + login flow
    const primaryContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const primaryPage = await primaryContext.newPage();
    attachCollectors(primaryPage, "primary-desktop");

    // === Console & basic loading + performance + SEO ===
    const firstLoadStart = Date.now();
    await primaryPage.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS });
    await primaryPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const firstLoadDuration = Date.now() - firstLoadStart;

    const homeShot = await saveScreenshot(primaryPage, "01-home.png");

    const homeNotBlank = await primaryPage.evaluate(() => {
      const textLength = (document.body?.innerText || "").trim().length;
      const visibleNodes = [...document.body.querySelectorAll("*")].filter((node) => {
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      }).length;
      return {
        textLength,
        visibleNodes,
        hasNoBlankScreen: textLength > 40 && visibleNodes > 10,
      };
    });

    addCheck(
      "Konsol ve Temel Yüklenme",
      "Ana sayfa yüklenmesi: https://www.egitim.today/ beyaz ekran vermeden açılıyor",
      homeNotBlank.hasNoBlankScreen,
      `textLength=${homeNotBlank.textLength}, visibleNodes=${homeNotBlank.visibleNodes}`,
      { screenshot: path.relative(process.cwd(), homeShot) },
    );

    const reloadStart = Date.now();
    await primaryPage.reload({ waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS });
    await primaryPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const reloadDuration = Date.now() - reloadStart;
    const navigationPerf = await primaryPage.evaluate(() => {
      const navEntry = performance.getEntriesByType("navigation")[0];
      if (!navEntry) return null;
      return {
        domInteractive: navEntry.domInteractive,
        loadEventEnd: navEntry.loadEventEnd,
      };
    });
    const domInteractiveMs = navigationPerf?.domInteractive ?? reloadDuration;
    addCheck(
      "Performans",
      "İlk yük süresi: Önbellekli durumda interaktivite < 3 saniye",
      domInteractiveMs < PERFORMANCE_THRESHOLD_MS,
      `domInteractive=${formatDuration(navigationPerf?.domInteractive)}, reloadDuration=${formatDuration(reloadDuration)}, firstLoad=${formatDuration(firstLoadDuration)}`,
      { thresholdMs: PERFORMANCE_THRESHOLD_MS },
    );

    const pageTitle = await primaryPage.title();
    const titleLooksGood =
      /tyt/i.test(pageTitle) &&
      /ayt/i.test(pageTitle) &&
      /(egitim\.today|learnconnect)/i.test(pageTitle);
    addCheck(
      "SEO ve Metadata",
      "Title: ürün ismini ve ana amacı yansıtıyor",
      titleLooksGood,
      `title="${pageTitle}"`,
    );

    const faviconHref = await primaryPage.evaluate(() => {
      const favicon = document.querySelector("link[rel~='icon']");
      return favicon?.getAttribute("href") || null;
    });
    let faviconStatus = null;
    let faviconUrl = null;
    if (faviconHref) {
      faviconUrl = new URL(faviconHref, primaryPage.url()).href;
      const faviconResp = await primaryContext.request.get(faviconUrl);
      faviconStatus = faviconResp.status();
    }
    addCheck(
      "SEO ve Metadata",
      "Favicon: favicon düzgün yükleniyor",
      faviconStatus === 200,
      `faviconUrl=${faviconUrl || "n/a"}, status=${faviconStatus ?? "n/a"}`,
    );

    // === Login page render ===
    await primaryPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS });
    await primaryPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const loginFormVisible = await primaryPage.locator("form").first().isVisible().catch(() => false);
    const loginHeaderVisible = await bodyContainsAny(primaryPage, ["Giriş Yap", "Sign In"]);
    const loginSubmitVisible = await primaryPage.locator("button[type='submit']").first().isVisible().catch(() => false);
    addCheck(
      "Giriş Akışı (/login)",
      "Sayfa açılışı: /login rotası düzgün render oluyor (form, başlık, butonlar görünür)",
      loginFormVisible && loginHeaderVisible && loginSubmitVisible,
      `form=${loginFormVisible}, heading=${loginHeaderVisible}, submitButton=${loginSubmitVisible}`,
    );

    // === Register flow: render + validation + successful registration ===
    await primaryPage.goto(`${BASE_URL}/register`, { waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS });
    await primaryPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});

    const registerFormVisible = await primaryPage.locator("form").first().isVisible().catch(() => false);
    const registerHeaderVisible = await bodyContainsAny(primaryPage, ["Kayıt Ol", "Sign Up"]);
    addCheck(
      "Kayıt Akışı (/register)",
      "Sayfa açılışı: /register rotası düzgün açılıyor",
      registerFormVisible && registerHeaderVisible,
      `form=${registerFormVisible}, heading=${registerHeaderVisible}`,
    );

    let registerRequestCount = 0;
    primaryPage.on("request", (request) => {
      if (request.url().includes("/api/register") && request.method() === "POST") {
        registerRequestCount += 1;
      }
    });

    if (registerFormVisible) {
      const preValidationConsoleIndex = consoleEntries.length;
      await primaryPage.fill("#displayName", "Smoke Validation User");
      await primaryPage.fill("#username", `smoke_validation_${Date.now().toString(36)}`);
      await primaryPage.fill("#password", "Smoke123");
      await primaryPage.fill("#confirmPassword", "Smoke456");
      const mismatchBefore = registerRequestCount;
      await primaryPage.click("button[type='submit']");
      await primaryPage.waitForTimeout(1000);
      const mismatchBlocked = registerRequestCount === mismatchBefore;
      const mismatchVisibleOnPage = await bodyContainsAny(primaryPage, ["Şifreler eşleşmiyor", "Passwords do not match"]);
      const mismatchToastLogged = consoleEntries
        .slice(preValidationConsoleIndex)
        .some((entry) => /\[toast\]/i.test(entry.text) && /eşleşmiyor|do not match/i.test(entry.text));
      addCheck(
        "Kayıt Akışı (/register)",
        "Validasyon: Şifre eşleşmiyorsa hata mesajı gösteriliyor ve submit olmuyor",
        mismatchBlocked && (mismatchVisibleOnPage || mismatchToastLogged),
        `blocked=${mismatchBlocked}, visibleMessage=${mismatchVisibleOnPage}, toastLogged=${mismatchToastLogged}`,
      );

      await primaryPage.fill("#displayName", "Smoke Validation User");
      await primaryPage.fill("#username", `smoke_short_${Date.now().toString(36)}`);
      await primaryPage.fill("#password", "12345");
      await primaryPage.fill("#confirmPassword", "12345");
      const shortPasswordInvalid = await primaryPage.$eval("#password", (input) => !input.checkValidity());
      const shortBefore = registerRequestCount;
      const shortValidationConsoleIndex = consoleEntries.length;
      await primaryPage.click("button[type='submit']");
      await primaryPage.waitForTimeout(1000);
      const shortBlocked = registerRequestCount === shortBefore;
      const shortVisibleOnPage = await bodyContainsAny(primaryPage, ["en az 6 karakter", "at least 6 characters"]);
      const shortToastLogged = consoleEntries
        .slice(shortValidationConsoleIndex)
        .some((entry) => /\[toast\]/i.test(entry.text) && /6 karakter|6 characters/i.test(entry.text));

      addCheck(
        "Kayıt Akışı (/register)",
        "Validasyon: Şifre uzunluğu/formatı için hata mesajı doğru zamanda gösteriliyor",
        shortBlocked && (shortPasswordInvalid || shortVisibleOnPage || shortToastLogged),
        `blocked=${shortBlocked}, browserInvalid=${shortPasswordInvalid}, visibleMessage=${shortVisibleOnPage}, toastLogged=${shortToastLogged}`,
      );

      const uniqueUsername = `smoke_${Date.now().toString(36)}`;
      const uniquePassword = `Smoke${Date.now().toString(36)}!`;
      const uniqueDisplayName = "Smoke Regression User";

      await primaryPage.fill("#displayName", uniqueDisplayName);
      await primaryPage.fill("#username", uniqueUsername);
      await primaryPage.fill("#password", uniquePassword);
      await primaryPage.fill("#confirmPassword", uniquePassword);

      const registerSubmitStart = Date.now();
      const registerResponsePromise = primaryPage.waitForResponse(
        (response) =>
          response.url().includes("/api/register") &&
          response.request().method() === "POST",
        { timeout: CHECK_TIMEOUT_MS },
      ).catch(() => null);
      await primaryPage.click("button[type='submit']");
      const registerResponse = await registerResponsePromise;
      const registerSubmitDuration = Date.now() - registerSubmitStart;
      interactionDurations.push({
        name: "Register form submit",
        durationMs: registerSubmitDuration,
      });

      const registerStatus = registerResponse?.status() ?? null;
      let registerRedirectOk = false;
      await primaryPage.waitForURL(/\/(tyt-dashboard|dashboard)(\/|$)/, {
        timeout: CHECK_TIMEOUT_MS,
      }).then(() => {
        registerRedirectOk = true;
      }).catch(() => {
        registerRedirectOk = /\/(tyt-dashboard|dashboard)(\/|$)/.test(new URL(primaryPage.url()).pathname);
      });

      const registerSuccess = (registerStatus === 200 || registerStatus === 201) && registerRedirectOk;
      if (registerSuccess) {
        createdUser = {
          username: uniqueUsername,
          password: uniquePassword,
        };
      }

      addCheck(
        "Kayıt Akışı (/register)",
        "Kayıt sonrası davranış: başarılı kayıt sonrası kullanıcı dashboard’a yönleniyor",
        registerSuccess,
        `status=${registerStatus ?? "n/a"}, redirected=${registerRedirectOk}, finalUrl=${primaryPage.url()}`,
      );
    } else {
      addCheck(
        "Kayıt Akışı (/register)",
        "Validasyon: Şifre eşleşmiyorsa hata mesajı gösteriliyor ve submit olmuyor",
        false,
        `Register formu görüntülenemedi (finalUrl=${primaryPage.url()})`,
      );
      addCheck(
        "Kayıt Akışı (/register)",
        "Validasyon: Şifre uzunluğu/formatı için hata mesajı doğru zamanda gösteriliyor",
        false,
        `Register formu görüntülenemedi (finalUrl=${primaryPage.url()})`,
      );
      addCheck(
        "Kayıt Akışı (/register)",
        "Kayıt sonrası davranış: başarılı kayıt sonrası kullanıcı dashboard’a yönleniyor",
        false,
        `Register formu görüntülenemedi, submit akışı test edilemedi (finalUrl=${primaryPage.url()})`,
      );
    }

    // === Dashboard checks (authenticated user expected) ===
    await primaryPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS });
    await primaryPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const dashboardShot = await saveScreenshot(primaryPage, "02-dashboard-desktop.png");

    const dashboardHasCoreBlocks = await bodyContainsAny(primaryPage, [
      "Bugün Çalışılan",
      "Devam Eden Öğrenme Yolları",
      "Hızlı Not Ekle",
    ]);
    const dashboardHasEmptyState = await bodyContainsAny(primaryPage, [
      "Henüz aktif öğrenme yolun yok",
      "Henüz notun yok",
      "0 dk",
    ]);
    addCheck(
      "Dashboard Görünümü",
      "Boş state: veri yokken bile hizalı ve okunur",
      dashboardHasCoreBlocks && dashboardHasEmptyState,
      `coreBlocks=${dashboardHasCoreBlocks}, emptyStateHints=${dashboardHasEmptyState}`,
      { screenshot: path.relative(process.cwd(), dashboardShot) },
    );

    const cardLayout = await primaryPage.evaluate(() => {
      const titles = ["Bugün Çalışılan", "Seri", "Aktif Yollar"];
      const metrics = titles.map((title) => {
        const heading = [...document.querySelectorAll("h3")].find((node) =>
          node.textContent?.trim().includes(title),
        );
        const card = heading?.closest("div.bg-white");
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return {
          title,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          top: rect.top,
        };
      });
      return {
        viewportWidth: window.innerWidth,
        cards: metrics,
      };
    });
    const allCardsFound = cardLayout.cards.every(Boolean);
    const cardsFitViewport = allCardsFound
      ? cardLayout.cards.every((card) => card.right <= cardLayout.viewportWidth + 1 && card.width > 120)
      : false;

    addCheck(
      "Dashboard Görünümü",
      "Kart düzeni: başlık/ikon/sayılar taşma yapmadan görünüyor",
      allCardsFound && cardsFitViewport,
      `cardsFound=${allCardsFound}, cardsFitViewport=${cardsFitViewport}, viewportWidth=${cardLayout.viewportWidth}`,
    );

    desktopGreetingResult = await getGreetingOverflow(primaryPage);

    // === Navigation and interaction checks ===
    const navTargets = [
      { label: "TYT", path: "/tyt-dashboard" },
      { label: "AYT", path: "/ayt-dashboard" },
      { label: "YKS", path: "/yks-dashboard" },
      { label: "Kurslar", path: "/courses" },
      { label: "Defterim", path: "/notebook" },
      { label: "Topluluk", path: "/community" },
    ];
    let allMainLinksWorking = true;
    const navEvidence = [];
    await primaryPage.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await primaryPage.waitForTimeout(1500);
    const navHrefs = await primaryPage.evaluate(() =>
      [...document.querySelectorAll("a")]
        .map((anchor) => anchor.getAttribute("href"))
        .filter((href) => typeof href === "string"),
    );

    for (const target of navTargets) {
      const linkExistsInMarkup = navHrefs.includes(target.path);
      const routeRegex = new RegExp(`${escapeRegex(target.path)}(?:/|$)`);
      const navStart = Date.now();
      await primaryPage.goto(`${BASE_URL}${target.path}`, {
        waitUntil: "domcontentloaded",
        timeout: CHECK_TIMEOUT_MS,
      }).catch(() => {});
      const navDuration = Date.now() - navStart;
      interactionDurations.push({
        name: `Navigation route change (${target.label})`,
        durationMs: navDuration,
      });

      const finalPath = new URL(primaryPage.url()).pathname;
      const routeOpened = routeRegex.test(finalPath);
      const pageNotBlank = await primaryPage.evaluate(() => {
        return (document.body?.innerText || "").trim().length > 30;
      });

      navEvidence.push(
        `${target.label}: linkInMarkup=${linkExistsInMarkup}, finalPath=${finalPath}, pageNotBlank=${pageNotBlank}, duration=${formatDuration(navDuration)}`,
      );

      if (!linkExistsInMarkup || !routeOpened) {
        allMainLinksWorking = false;
      }
    }

    addCheck(
      "Navigasyon",
      "Ana linkler: TYT/AYT/YKS/Kurslar/Defterim/Topluluk ilgili sayfaları açıyor",
      allMainLinksWorking,
      allMainLinksWorking ? "Tüm ana linkler çalışıyor" : "Bir veya daha fazla ana linkte sorun var",
      { navigations: navEvidence.join(" | ") },
    );

    await primaryPage.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await primaryPage.goto(`${BASE_URL}/courses`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    }).catch(() => {});
    await primaryPage.goto(`${BASE_URL}/notebook`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    }).catch(() => {});

    await primaryPage.goBack({ waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const backUrl = primaryPage.url();
    await primaryPage.goForward({ waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const forwardUrl = primaryPage.url();
    const historyWorks = /\/courses(\/|$)/.test(new URL(backUrl).pathname) && /\/notebook(\/|$)/.test(new URL(forwardUrl).pathname);

    addCheck(
      "Navigasyon",
      "History uyumu: browser back/forward ile URL ve içerik senkron",
      historyWorks,
      `backUrl=${backUrl}, forwardUrl=${forwardUrl}`,
    );

    const maxInteraction = interactionDurations.reduce((max, current) => Math.max(max, current.durationMs), 0);
    const hasInteractionData = interactionDurations.length > 0;
    addCheck(
      "Performans",
      "Etkileşim: nav/tıklama/form submit sırasında belirgin donma yok",
      hasInteractionData && maxInteraction <= NAV_INTERACTION_THRESHOLD_MS,
      `measurementCount=${interactionDurations.length}, maxInteraction=${formatDuration(maxInteraction)}, threshold=${NAV_INTERACTION_THRESHOLD_MS} ms`,
    );

    // === Logout then login flow test ===
    const logoutResponse = await primaryContext.request.post(`${BASE_URL}/api/logout`).catch(() => null);
    const logoutStatus = logoutResponse?.status?.() ?? null;
    await primaryPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: CHECK_TIMEOUT_MS });
    await primaryPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});

    const loginInputVisible = await primaryPage.locator("#username").first().isVisible().catch(() => false);
    const passwordInputVisible = await primaryPage.locator("#password").first().isVisible().catch(() => false);
    const loginSubmitButtonVisible = await primaryPage.locator("button[type='submit']").first().isVisible().catch(() => false);
    const canRunLoginFormFlow = loginInputVisible && passwordInputVisible && loginSubmitButtonVisible;

    if (canRunLoginFormFlow) {
      const loginUser = createdUser?.username || "demo";
      const loginPass = createdUser?.password || "demo123";
      await primaryPage.fill("#username", loginUser);
      await primaryPage.fill("#password", loginPass);

      const loginSubmitStart = Date.now();
      const loginResponsePromise = primaryPage.waitForResponse(
        (response) =>
          response.url().includes("/api/login") &&
          response.request().method() === "POST",
        { timeout: CHECK_TIMEOUT_MS },
      ).catch(() => null);

      await primaryPage.click("button[type='submit']");
      const loginResponse = await loginResponsePromise;
      const loginDuration = Date.now() - loginSubmitStart;
      interactionDurations.push({
        name: "Login form submit",
        durationMs: loginDuration,
      });

      const loginStatus = loginResponse?.status() ?? null;
      const loginStatusOk = loginStatus === 200 || loginStatus === 201;
      addCheck(
        "Giriş Akışı (/login)",
        "Form gönderimi: geçerli veriyle submit, network isteği expected status dönüyor",
        loginStatusOk,
        `username=${loginUser}, status=${loginStatus ?? "n/a"}, duration=${formatDuration(loginDuration)}, logoutStatus=${logoutStatus ?? "n/a"}`,
      );

      let loginRedirectOk = false;
      await primaryPage.waitForURL(/\/(tyt-dashboard|dashboard)(\/|$)/, {
        timeout: CHECK_TIMEOUT_MS,
      }).then(() => {
        loginRedirectOk = true;
      }).catch(() => {
        loginRedirectOk = /\/(tyt-dashboard|dashboard)(\/|$)/.test(new URL(primaryPage.url()).pathname);
      });
      addCheck(
        "Giriş Akışı (/login)",
        "Yönlendirme: başarılı giriş sonrası /tyt-dashboard veya dashboard’a gidiliyor",
        loginRedirectOk,
        `finalUrl=${primaryPage.url()}`,
      );
    } else {
      // Fallback diagnostic: check direct API login endpoint status
      const loginApiDiagnosticResponse = await primaryContext.request.post(`${BASE_URL}/api/login`, {
        data: { username: "demo", password: "demo123" },
      }).catch(() => null);
      const loginApiStatus = loginApiDiagnosticResponse?.status?.() ?? null;

      addCheck(
        "Giriş Akışı (/login)",
        "Form gönderimi: geçerli veriyle submit, network isteği expected status dönüyor",
        false,
        `Login formu görünmüyor (usernameField=${loginInputVisible}, passwordField=${passwordInputVisible}, submit=${loginSubmitButtonVisible}, finalUrl=${primaryPage.url()}, logoutStatus=${logoutStatus ?? "n/a"}, apiLoginStatus=${loginApiStatus ?? "n/a"})`,
      );
      addCheck(
        "Giriş Akışı (/login)",
        "Yönlendirme: başarılı giriş sonrası /tyt-dashboard veya dashboard’a gidiliyor",
        false,
        `Login formu görünmediği için UI login redirect testi yapılamadı (finalUrl=${primaryPage.url()})`,
      );
    }

    await primaryContext.storageState({ path: authStatePath });
    await primaryContext.close();

    // MOBILE AUTH FLOW: navbar/cards/greeting on small screens
    const mobileAuthContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      storageState: authStatePath,
    });
    const mobileAuthPage = await mobileAuthContext.newPage();
    attachCollectors(mobileAuthPage, "mobile-auth");

    await mobileAuthPage.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await mobileAuthPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const mobileDashShot = await saveScreenshot(mobileAuthPage, "03-dashboard-mobile.png");

    const mobileOverflow = await horizontalOverflowInfo(mobileAuthPage);
    const menuButton = mobileAuthPage.getByRole("button", { name: /Menü/i }).first();
    const menuVisible = await menuButton.isVisible().catch(() => false);
    let menuLinksVisible = false;
    if (menuVisible) {
      await menuButton.click().catch(() => {});
      menuLinksVisible = await bodyContainsAny(mobileAuthPage, ["Kurslar", "Defterim", "Topluluk"]);
    }

    addCheck(
      "Mobil Görünüm",
      "Navbar: küçük ekranlarda taşma yok, menü butonları erişilebilir",
      !mobileOverflow.hasOverflow && menuVisible && menuLinksVisible,
      `overflow=${mobileOverflow.hasOverflow}, menuVisible=${menuVisible}, menuLinksVisible=${menuLinksVisible}`,
      { screenshot: path.relative(process.cwd(), mobileDashShot) },
    );

    const mobileCardStack = await mobileAuthPage.evaluate(() => {
      const titles = ["Bugün Çalışılan", "Seri", "Aktif Yollar"];
      const tops = [];
      for (const title of titles) {
        const heading = [...document.querySelectorAll("h3")].find((node) =>
          node.textContent?.trim().includes(title),
        );
        const card = heading?.closest("div.bg-white");
        if (!card) continue;
        tops.push(card.getBoundingClientRect().top);
      }
      return tops;
    });
    const cardsStacked =
      mobileCardStack.length === 3 &&
      mobileCardStack[1] > mobileCardStack[0] + 12 &&
      mobileCardStack[2] > mobileCardStack[1] + 12;
    addCheck(
      "Mobil Görünüm",
      "Kartlar: mobilde üst üste düzgün diziliyor (yatay scroll yok)",
      cardsStacked && !mobileOverflow.hasOverflow,
      `cardTops=${mobileCardStack.join(", ")}, overflow=${mobileOverflow.hasOverflow}`,
    );

    mobileGreetingResult = await getGreetingOverflow(mobileAuthPage);
    await mobileAuthContext.close();

    // Dashboard greeting check (desktop + mobile together)
    const greetingPass =
      desktopGreetingResult?.exists &&
      !desktopGreetingResult?.overflow &&
      mobileGreetingResult?.exists &&
      !mobileGreetingResult?.overflow;

    addCheck(
      "Dashboard Görünümü",
      "Karşılama başlığı: “Merhaba [isim]” mobil ve desktop’ta taşmadan gösteriliyor",
      Boolean(greetingPass),
      `desktopExists=${desktopGreetingResult?.exists || false}, desktopOverflow=${desktopGreetingResult?.overflow || false}, mobileExists=${mobileGreetingResult?.exists || false}, mobileOverflow=${mobileGreetingResult?.overflow || false}`,
    );

    // MOBILE ANON FLOW: login/register forms fit screen
    const mobileAnonContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const mobileAnonPage = await mobileAnonContext.newPage();
    attachCollectors(mobileAnonPage, "mobile-anon");

    await mobileAnonPage.goto(`${BASE_URL}/login`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await mobileAnonPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const loginMobileOverflow = await horizontalOverflowInfo(mobileAnonPage);
    const loginFormVisibleMobile = await mobileAnonPage.locator("form").first().isVisible().catch(() => false);
    const loginFormFits = await mobileAnonPage.evaluate(() => {
      const width = window.innerWidth;
      return [...document.querySelectorAll("input, button")].every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= width + 1;
      });
    });

    await mobileAnonPage.goto(`${BASE_URL}/register`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await mobileAnonPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const registerMobileOverflow = await horizontalOverflowInfo(mobileAnonPage);
    const registerFormVisibleMobile = await mobileAnonPage.locator("form").first().isVisible().catch(() => false);
    const registerFormFits = await mobileAnonPage.evaluate(() => {
      const width = window.innerWidth;
      return [...document.querySelectorAll("input, button")].every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= width + 1;
      });
    });
    addCheck(
      "Mobil Görünüm",
      "Formlar: login/register input ve butonlar ekrana sığıyor, yatay scroll yok",
      loginFormVisibleMobile &&
        registerFormVisibleMobile &&
        !loginMobileOverflow.hasOverflow &&
        loginFormFits &&
        !registerMobileOverflow.hasOverflow &&
        registerFormFits,
      `loginFormVisible=${loginFormVisibleMobile}, registerFormVisible=${registerFormVisibleMobile}, loginOverflow=${loginMobileOverflow.hasOverflow}, registerOverflow=${registerMobileOverflow.hasOverflow}, loginFormFits=${loginFormFits}, registerFormFits=${registerFormFits}`,
    );
    await mobileAnonContext.close();

    // AUTHORIZATION + 404 checks with anonymous desktop context
    const anonContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const anonPage = await anonContext.newPage();
    attachCollectors(anonPage, "authz-anon");

    await anonPage.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await anonPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const adminBlocked =
      anonPage.url().includes("/login") ||
      (await bodyContainsAny(anonPage, ["Yönetici Girişi", "Admin Login", "Sign in as administrator"]));
    addCheck(
      "Yetki Kontrolleri",
      "Admin route: /admin yetkisiz kullanıcıda engelleniyor",
      adminBlocked,
      `finalUrl=${anonPage.url()}`,
    );

    await anonPage.goto(`${BASE_URL}/teacher`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await anonPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const teacherBlocked =
      anonPage.url().includes("/login") ||
      (await bodyContainsAny(anonPage, ["Giriş Yap", "Unauthorized", "Yetkisiz"]));
    addCheck(
      "Yetki Kontrolleri",
      "Teacher route: /teacher yetkisiz kullanıcıda engelleniyor",
      teacherBlocked,
      `finalUrl=${anonPage.url()}`,
    );

    await anonPage.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await anonPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const protectedRedirectToLogin =
      anonPage.url().includes("/login") ||
      (await bodyContainsAny(anonPage, ["Giriş Yap", "Sign In", "Hesabınıza giriş yapın"]));
    addCheck(
      "Yetki Kontrolleri",
      "Anonim kullanıcılar protected route’larda /login’e yönlendiriliyor",
      protectedRedirectToLogin,
      `finalUrl=${anonPage.url()}`,
    );

    const missingRoute = `/__smoke_not_found_${Date.now().toString(36)}__`;
    await anonPage.goto(`${BASE_URL}${missingRoute}`, {
      waitUntil: "domcontentloaded",
      timeout: CHECK_TIMEOUT_MS,
    });
    await anonPage.waitForLoadState("networkidle", { timeout: CHECK_TIMEOUT_MS }).catch(() => {});
    const route404Shot = await saveScreenshot(anonPage, "04-404-check.png");
    const route404BodyText = await anonPage.evaluate(() => (document.body?.innerText || "").trim());
    const hasFriendly404Text = /404|not found|sayfa bulunamadı|geri dön/i.test(route404BodyText);
    const hasRawError = /TypeError|ReferenceError|Cannot GET|stack trace/i.test(route404BodyText);
    const isStillOnMissingRoute = new URL(anonPage.url()).pathname === missingRoute;
    const friendly404 = hasFriendly404Text && !hasRawError && isStillOnMissingRoute;
    addCheck(
      "SEO ve Metadata",
      "404 sayfası: var olmayan rotada kullanıcı dostu 404 gösteriliyor",
      friendly404,
      `finalUrl=${anonPage.url()}, hasFriendlyText=${hasFriendly404Text}, rawError=${hasRawError}, stayedOnMissingRoute=${isStillOnMissingRoute}`,
      { screenshot: path.relative(process.cwd(), route404Shot) },
    );
    await anonContext.close();

    // Main JS/CSS status evaluation
    const uniqueAssets = dedupeByUrl(jsCssResponses);
    const jsAssets = uniqueAssets.filter((asset) => /\.js(\?|$)/i.test(asset.url));
    const cssAssets = uniqueAssets.filter((asset) => /\.css(\?|$)/i.test(asset.url));
    const badAssets = uniqueAssets.filter((asset) => asset.status >= 400);
    const mainAssetsHealthy = jsAssets.length > 0 && cssAssets.length > 0 && badAssets.length === 0;
    addCheck(
      "Performans",
      "Ağ istekleri: ana JS/CSS dosyaları 200 dönüyor, 404/500 yok",
      mainAssetsHealthy,
      `jsAssets=${jsAssets.length}, cssAssets=${cssAssets.length}, badAssets=${badAssets.length}`,
      {
        badAssetSample: badAssets.slice(0, 5).map((asset) => `${asset.status} ${asset.url}`).join(" | "),
      },
    );

    // Console clean check at the end
    const uniqueCriticalIssues = [];
    const seen = new Set();
    for (const issue of criticalConsoleIssues) {
      const key = `${issue.label}|${issue.type}|${issue.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCriticalIssues.push(issue);
      }
    }
    addCheck(
      "Konsol ve Temel Yüklenme",
      "Konsolda hata yok: React undefined / SES / uncaught exception yok",
      uniqueCriticalIssues.length === 0,
      uniqueCriticalIssues.length === 0
        ? "Kritik console/page hatası yakalanmadı"
        : `${uniqueCriticalIssues.length} kritik issue yakalandı`,
      {
        sampleIssues: uniqueCriticalIssues
          .slice(0, 5)
          .map((issue) => `[${issue.label}] ${issue.type}: ${issue.text}`)
          .join(" | "),
      },
    );
  } finally {
    await browser.close();
  }

  const durationMs = Date.now() - runStartedAt;
  const summary = summarizeChecks();
  const uniqueAssets = dedupeByUrl(jsCssResponses);
  const report = {
    meta: {
      timestamp,
      baseUrl: BASE_URL,
      durationMs,
      reportDir: path.relative(process.cwd(), reportDir),
      createdUser,
    },
    summary,
    checks,
    criticalConsoleIssues: criticalConsoleIssues.slice(0, 200),
    interactionDurations,
    mainAssetResponses: uniqueAssets,
  };

  const markdownReport = buildMarkdownReport(report);

  await fs.writeFile(reportJsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(reportMarkdownPath, markdownReport, "utf8");

  console.log("");
  console.log("==============================================");
  console.log("egitim.today Smoke & Regression Checklist Run");
  console.log("==============================================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
  console.log(`JSON report: ${path.relative(process.cwd(), reportJsonPath)}`);
  console.log(`Markdown report: ${path.relative(process.cwd(), reportMarkdownPath)}`);
  console.log("==============================================");
  console.log("");

  process.exit(summary.failed > 0 ? 1 : 0);
}

run().catch(async (error) => {
  await fs.mkdir(reportDir, { recursive: true }).catch(() => {});
  const fallbackReport = {
    meta: {
      timestamp,
      baseUrl: BASE_URL,
      fatal: true,
    },
    error: {
      message: error?.message || String(error),
      stack: error?.stack || null,
    },
  };
  await fs.writeFile(reportJsonPath, JSON.stringify(fallbackReport, null, 2), "utf8").catch(() => {});
  console.error("Smoke/regression checklist run failed:", error);
  process.exit(1);
});
