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

  console.log("🌐 Cargando página principal...");
  await page.goto(URL, { waitUntil: "networkidle2" });

  // Leer todas las jornadas
  const jornadas = await page.$$eval("#season option", (opts) =>
    opts.map((o) => ({
      value: o.value,
      text: o.textContent.trim(),
      selected: o.hasAttribute("selected"),
    }))
  );

  const actualIndex = jornadas.findIndex((j) => j.selected);
  const siguiente = jornadas[actualIndex + 1];

  if (!siguiente) {
    console.log("⚠️ No hay una jornada siguiente disponible.");
    await browser.close();
    return;
  }

  console.log(`➡️ Jornada actual: ${jornadas[actualIndex].text}`);
  console.log(`✅ Próxima jornada detectada: ${siguiente.text}`);

  // Cambiar el selector a la próxima jornada
  await page.select("#season", siguiente.value);
  await page.waitForTimeout(3000);

  const html = await page.content();
  const $ = cheerio.load(html);

  const items = [];

  $(".match-link").each((i, el) => {
    const link = $(el).attr("href");
    if (!link) return;

    const home = $(el).find(".team_left .name").text().trim();
    const away = $(el).find(".team_right .name").text().trim();
    if (!home || !away) return;

    const homeImg = $(el).find(".team_left img").attr("src") || "";
    const awayImg = $(el).find(".team_right img").attr("src") || "";

    const date = $(el).find(".date, .date-transform").text().trim();
    const hour = $(el).find(".match_hour").text().trim();

    const r1 = $(el).find(".r1").text().trim();
    const r2 = $(el).find(".r2").text().trim();
    const score = r1 && r2 ? `${r1} - ${r2}` : "";

    const statusRaw = $(el).find(".match-status-label b").text().trim();
    let status = "Programado";
    if (statusRaw === "Fin") status = "Finalizado";
    if (statusRaw === "En juego") status = "En juego";

    let title = `${home} vs ${away}`;
    if (score) title = `${home} ${score} ${away}`;
    if (status === "En juego") title += " (En juego)";
    title += ` — ${date}`;

    let description = `
      <b>${home}</b> vs <b>${away}</b><br>
      📅 Fecha: ${date}<br>
      ⏰ Hora: ${hour || "Sin hora"}<br>
      📌 Estado: ${status}<br>
    `;

    if (score) description += `⚽ Resultado: ${score}<br>`;

    description += `
      <br>
      <img src="${homeImg}" height="40">
      <img src="${awayImg}" height="40">
    `;

    items.push(`
      <item>
        <title><![CDATA[${title}]]></title>
        <link>${link}</link>
        <description><![CDATA[${description}]]></description>
        <guid>${link}</guid>
      </item>
    `);
  });

  await browser.close();

  const rss = `
    <rss version="2.0">
      <channel>
        <title>Primera Andaluza Huelva G1 - Próxima Jornada</title>
        <link>${URL}</link>
        <description>Próximos partidos de la jornada ${siguiente.text}</description>
        ${items.join("\n")}
      </channel>
    </rss>
  `;

  fs.writeFileSync("feed.xml", rss.trim());
  console.log(`\n✅ RSS actualizado correctamente (${items.length} partidos de ${siguiente.text}).`);
}

scrape();
