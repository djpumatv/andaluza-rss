import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";

const URL = "https://es.besoccer.com/competicion/resultados/andaluza/2026/grupo1";

async function scrape() {
    const res = await fetch(URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = [];

    $(".match-link").each((i, el) => {
        const link = $(el).attr("href");
        if (!link) return;

        // Equipos
        const home = $(el).find(".team_left .name").text().trim();
        const away = $(el).find(".team_right .name").text().trim();

        // Escudos
        const homeImg = $(el).find(".team_left img").attr("src") || "";
        const awayImg = $(el).find(".team_right img").attr("src") || "";

        // Fecha
        const date = $(el).find(".date").text().trim() || $(el).find(".date-transform").text().trim();

        // Hora
        const hour = $(el).find(".match_hour").text().trim();

        // Estado real
        const statusRaw = $(el).find(".match-status-label b").text().trim();
        let status = "Programado";
        if (statusRaw === "Fin") status = "Finalizado";
        if (statusRaw === "En juego") status = "En juego";

        // Marcador
        const r1 = $(el).find(".r1").text().trim();
        const r2 = $(el).find(".r2").text().trim();
        const score = (r1 && r2) ? `${r1} - ${r2}` : "";

        // Minuto (si existe)
        const minute = $(el).find(".minute, .liveMinute, .match_minute").text().trim();

        // Título del item
        let title = `${home} vs ${away}`;
        if (score) title = `${home} ${score} ${away}`;
        if (status === "Programado") title += " (Próximo)" ;
        if (status === "En juego") title += ` (En juego ${minute})`;

        // Descripción más bonita
        let description = `
            <b>${home}</b> vs <b>${away}</b><br><br>
            🏟 <b>Competición:</b> Primera Andaluza Huelva G1<br>
            📅 <b>Fecha:</b> ${date}<br>
            ⏰ <b>Hora:</b> ${hour || "Sin hora"}<br>
            📌 <b>Estado:</b> ${status}<br>
        `;

        if (score) description += `⚽ <b>Resultado:</b> ${score}<br>`;

        if (minute) description += `🕒 <b>Minuto:</b> ${minute}<br>`;

        if (homeImg && awayImg) {
            description += `
                <br>
                <img src="${homeImg}" height="40" /> 
                <img src="${awayImg}" height="40" />
            `;
        }

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
