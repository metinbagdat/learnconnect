import { Router } from "express";
import { generateSitemap, defaultSitemapEntries } from "./sitemap.js";

const router = Router();

router.get("/sitemap.xml", (req, res) => {
  const sitemap = generateSitemap(defaultSitemapEntries);
  res.header("Content-Type", "application/xml");
  res.send(sitemap);
});

router.get("/robots.txt", (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /auth
Allow: /courses
Allow: /entrance-exam-prep
Allow: /subscription
Allow: /tyt-dashboard
Disallow: /admin
Disallow: /dashboard-standalone
Disallow: /suggestions
Disallow: /*?*
Sitemap: https://learnconnect.net/sitemap.xml

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1
`;
  res.header("Content-Type", "text/plain");
  res.send(robotsTxt);
});

export default router;
