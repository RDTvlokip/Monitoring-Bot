const { Client, Intents, MessageEmbed } = require('discord.js');
const { keep_alive } = require("./keep_alive");
const fs = require('fs');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

let monitorings = new Map();
let lastMessageId = null;

function getDate() {
  const date = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short'
  };
  return date.toLocaleDateString('en-US', options);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "I'm monitoring your website", type: 'PLAYING' }],
    status: 'online'
  });

  const channel = client.channels.cache.get('1076131569032515604');
  if (channel) {
    // Chargement de l'ID du dernier message envoyé avant la déconnexion du bot
    try {
      const data = fs.readFileSync('lastMessageId.json');
      lastMessageId = JSON.parse(data);
    } catch (err) {
      console.error(err);
    }
    
    if (lastMessageId) {
      channel.messages.fetch(lastMessageId).then(message => {
        if (message.author.id === client.user.id) {
          console.log(`Supprimé l'ancien message avec l'ID ${lastMessageId}`);
          message.delete().catch(console.error);
        } else {
          console.log(`L'ancien message n'a pas été créé par le bot`);
        }
      }).catch(console.error);
    }
  }

  console.log(`Bot is connected to ${client.guilds.cache.size} servers:`);
  client.guilds.cache.forEach(guild => {
    console.log(`- ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
    guild.channels.cache.forEach(channel => {
      console.log(`--- ${channel.name} (${channel.id}) [${channel.type}]`);
    });
  });

  console.log(`Bot is listening to ${client.channels.cache.size} channels:`);
  client.channels.cache.forEach(channel => {
    console.log(`- ${channel.name} (${channel.id}) in server ${channel.guild.name} (${channel.guild.id}) [${channel.type}]`);
  });

  setInterval(() => {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

    const cpuUsagePercent = Math.round((cpuUsage.user + cpuUsage.system) / (cpuUsage.user + cpuUsage.system + process.cpuUsage().idle) * 10000) / 100;

    const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100;

    const ramUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const ramTotal = process.memoryUsage().heapTotal / 1024 / 1024;
    const ramUsageMB = Math.round(ramUsage * 100) / 100;
    const ramTotalMB = Math.round(ramTotal * 100) / 100;

    const diskUsage = fs.statSync('/');
    const diskTotal = Math.round(diskUsage.blocks * diskUsage.blksize / 1024 / 1024 / 1024 * 100) / 100;
    const diskFree = Math.round(diskUsage.blocks * diskUsage.blksize / 1024 / 1024 / 1024 * diskUsage.bfree / diskUsage.blocks * 100) / 100;

    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeSecondsRemainder = Math.round(uptimeSeconds % 60);
    const uptimeFormatted = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSecondsRemainder}s`;

    const clientUptimeSeconds = client.uptime / 1000;
    const clientUptimeHours = Math.floor(clientUptimeSeconds / 3600);
    const clientUptimeMinutes = Math.floor((clientUptimeSeconds % 3600) / 60);
    const clientUptimeSecondsRemainder = Math.round(clientUptimeSeconds % 60);
    const clientUptimeFormatted = `${clientUptimeHours}h ${clientUptimeMinutes}m ${clientUptimeSecondsRemainder}s`;

    
    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Bot Performance')
      .setDescription(`Performance du bot le ${getDate()}`)
      .addFields(
        { name: 'CPU Usage', value: `${cpuUsagePercent}%`, inline: true },
        { name: '————————————————————————————————————', value: ` `, inline: false },
      )
      .addFields(
        { name: 'Memory Usage', value: `${memoryUsageMB} MB`, inline: true },
        { name: 'RAM Usage', value: `${ramUsageMB} MB / ${ramTotalMB} MB Total`, inline: true },
        { name: '————————————————————————————————————', value: ` `, inline: false },
      )
      .addFields(
        { name: 'Ping', value: `${client.ws.ping} ms`, inline: true },
        { name: '————————————————————————————————————', value: ` `, inline: false },
      )
      .addFields(
        { name: 'Disk Usage', value: `${diskUsage}%`, inline: true },
        { name: 'Disk Total', value: `1024 MB`, inline: true },
        { name: 'Disk Free', value: `986 MB`, inline: true },
        { name: '————————————————————————————————————', value: ` `, inline: false },
        )

      .addFields(
        { name: 'Uptime Server', value: `${uptimeFormatted}`, inline: true },
        { name: 'Uptime Client', value: `${clientUptimeFormatted}`, inline: true }
      );

  if (channel) {
    channel.messages.fetch({ limit: 1 }).then(messages => {
      const lastMessage = messages.first();
      if (lastMessage && lastMessage.author.id === client.user.id) {
  lastMessage.edit({ embeds: [embed] }).then(() => {
    console.log(`Message modifié : ${lastMessageId} ${new Date().toLocaleString()}`);
  }).catch(console.error);
}

       else {
        console.log(`Envoyé à : ${lastMessageId} ${new Date().toLocaleString()}`);
        channel.send({ embeds: [embed] }).then(newMessage => {
          lastMessageId = newMessage.id;
          fs.writeFile('lastMessageId.json', JSON.stringify(lastMessageId), err => {
            if (err) {
              console.error(err);
            }
          });
        }).catch(console.error);
      }
    }).catch(console.error);
  }
}, 5000);

});

client.on('messageCreate', message => {
  console.log(`Message sent by ${message.author.username} in ${message.channel.name} on server ${message.guild.name}: ${message.content}`);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
  console.log(`Message edited by ${oldMessage.author.username} in ${oldMessage.channel.name} on server ${oldMessage.guild.name}: ${oldMessage.content} -> ${newMessage.content}`);
});

client.on('messageDelete', message => {
  console.log(`Message deleted by ${message.author.username} in ${message.channel.name} on server ${message.guild.name}: ${message.content}`);
});

client.on('message', message => {
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

  process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));

setInterval(() => {
  console.clear();
  console.log("Console nettoyée !");
}, 10000);

// Définition de l'ID des utilisateurs autorisés à redémarrer le bot
const authorizedUserIds = ['1074947886191738940'];

// Définition de la commande de redémarrage
client.on('message', message => {
  // Vérification que la commande est envoyée par un utilisateur autorisé
  if (authorizedUserIds.includes(message.author.id) && message.content === '!restart') {
    // Envoi d'un message indiquant le redémarrage du bot
    message.channel.send('Redémarrage en cours...')
      .then(sentMessage => {
        // Suppression de la commande !restart
        message.delete();
        
        // Arrêt du client Discord
        client.destroy();

        // Démarrage du client Discord
        client.login(process.env.TOKEN);
        
        // Suppression du message "Redémarrage en cours..."
        setTimeout(() => {
          sentMessage.delete();
        }, 2000);
      })
      .catch(console.error);
  }
});

client.login(process.env.TOKEN);