import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

const URL = "https://es.besoccer.com/competicion/resultados/andaluza/2026/grupo1";

async function scrape() {

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    );

    await page.goto(URL, { waitUntil: "networkidle2" });

    const html = await page.content();
    console.log("HTML length:", html.length);

    await browser.close();

    const $ = cheerio.load(html);
    const items = [];

    $(".match-link").each((i, el) => {
        const link = $(el).attr("href");
        if (!link) return;

        const home = $(el).find(".team_left .name").text().trim();
        const away = $(el).find(".team_right .name").text().trim();

        const homeImg = $(el).find(".team_left img").attr("src") || "";
        const awayImg = $(el).find(".team_right img").attr("src") || "";

        const date = $(el).find(".date, .date-transform").text().trim();
        const hour = $(el).find(".match_hour").text().trim();

        const r1 = $(el).find(".r1").text().trim();
        const r2 = $(el).find(".r2").text().trim();
        const score = r1 && r2 ? `${r1} - ${r2}` : "";

        const minute = $(el).find(".minute, .liveMinute, .match_minute").text().trim();

        const statusRaw = $(el).find(".match-status-label b").text().trim();
        let status = "Programado";

        if (statusRaw === "Fin") status = "Finalizado";
        if (statusRaw === "En juego") status = "En juego";

        // ------------------------
        //   TÍTULO MEJORADO
        // ------------------------
        let title = `${home} vs ${away}`;

        if (score) title = `${home} ${score} ${away}`;

        if (status === "En juego") title += " (EN JUEGO)";
        else if (status === "Finalizado") title += " (FINAL)";
        // No añadimos “Próximo”

        // ------------------------
        //   DESCRIPCIÓN
        // ------------------------
        let description = `
            <b>${home}</b> vs <b>${away}</b><br>
            📅 Fecha: ${date}<br>
        `;

        if (hour) description += `⏰ Hora: ${hour}<br>`;
        else description += `⏰ Hora: Sin hora<br>`;

        description += `📌 Estado: ${status}<br>`;

        if (score) description += `⚽ Resultado: ${score}<br>`;
        if (minute) description += `🕒 Minuto: ${minute}<br>`;

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

    const rss = `
        <rss version="2.0">
            <channel>
                <title>Primera Andaluza Huelva G1 - RSS</title>
                <link>${URL}</link>
                <description>Resultados, partidos en vivo y próximos encuentros</description>
                ${items.join("\n")}
            </channel>
        </rss>
    `;

    fs.writeFileSync("feed.xml", rss.trim());
    console.log("RSS actualizado correctamente ✔");
}

scrape();
