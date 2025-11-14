const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function generateRSS() {
    // URL base de BeSoccer para la competición
    const url = "https://es.besoccer.com/competicion/resultados/andaluza/2026/grupo1";

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let items = "";

        $(".match-list-item").each((i, el) => {
            const local = $(el).find(".team-local .name").text().trim();
            const away = $(el).find(".team-visitor .name").text().trim();

            const date = $(el).find(".match-date").text().trim();
            const hour = $(el).find(".match-hour").text().trim();

            let status = $(el).find(".status").text().trim();
            let score = $(el).find(".score").text().trim();

            let description = "";

            if (status.includes("Final")) {
                description = `Finalizado: ${score}`;
            } else if (status.includes("'") || status.includes("Min")) {
                description = `En juego: ${score}`;
            } else if (hour) {
                description = `Programado: ${date} - ${hour}`;
            } else {
                description = `Programado: ${date}`;
            }

            items += `
            <item>
                <title>${local} vs ${away}</title>
                <description>${description}</description>
                <pubDate>${date} ${hour}</pubDate>
                <guid>${local.replace(/ /g, "")}-${away.replace(/ /g, "")}-${i}</guid>
            </item>`;
        });

        const rssFeed = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
            <channel>
                <title>Primera Andaluza Huelva Grupo 1 - Partidos Automáticos</title>
                <link>${url}</link>
                <description>Feed automático actualizado desde BeSoccer</description>
                ${items}
            </channel>
        </rss>`;

        fs.writeFileSync("feed.xml", rssFeed);
        console.log("RSS generado correctamente.");

    } catch (err) {
        console.error("Error al generar RSS:", err);
    }
}

generateRSS();
