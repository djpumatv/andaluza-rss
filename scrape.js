import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

const URL = "https://es.besoccer.com/competicion/resultados/andaluza/2026/grupo1";

async function scrape() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
  );

  console.log("Cargando página...");
  await page.goto(URL, { waitUntil: "networkidle2" });

  // Esperar a que aparezca el bloque de resultados reales
  await page.waitForSelector(".match-list-new a.match-link", { timeout: 10000 }).catch(() => {});

  const html = await page.content();
  console.log("HTML length:", html.length);

  await browser.close();

  const $ = cheerio.load(html);
  const items = [];

  // 🔍 Solo partidos dentro de la lista de resultados
  $(".match-list-new a.match-link").each((i, el) => {
    const link = $(el).attr("href");
    if (!link) return;

    const home = $(el).find(".team_left .name").text().trim();
    const away = $(el).find(".team_right .name").text().trim();

    // Evitar partidos vacíos o banners
    if (!home || !away) return;

    const homeImg = $(el).find(".team_left img").attr("src") || "";
    const awayImg = $(el).find(".team_right img").attr("src") || "";

   const date = $(el).find(".date, .date-transform").text().trim();
const hour = $(el).find(".match_hour").text().trim();

const r1 = $(el).find(".r1").text().trim();
const r2 = $(el).find(".r2").text().trim();
const score = r1 && r2 ? `${r1} - ${r2}` : "";

