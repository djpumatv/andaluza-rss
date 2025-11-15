    const minute = $(el).find(".minute, .liveMinute, .match_minute").text().trim();

    const statusRaw = $(el).find(".match-status-label b").text().trim();
    let status = "Programado";
    if (statusRaw === "Fin") status = "Finalizado";
    if (statusRaw === "En juego") status = "En juego";

    // 🏷️ Construcción del título
    let title = `${home} vs ${away}`;
    if (hour) title += ` — ${hour}`;
    if (score) title = `${home} ${score} ${away}`;
    if (status === "En juego") {
      title = `${home} ${score || ""} ${away} (En juego ${minute})`.trim();
    }

    // 📝 Descripción
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
  console.log(`✔ RSS actualizado correctamente con ${items.length} partidos`);
}

scrape();
