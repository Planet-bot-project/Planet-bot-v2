const http = require('http');
http.createServer(function(req, res) {
  res.write('Discord bot is active.\nPleace check it.');
  res.end();
}).listen(8000);


const fs = require('fs')
const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command
}

client.once("ready", async () => {
  const data = []
  for (const commandName in commands) {
    data.push(commands[commandName].data)
  }
  await client.application.commands.set(data);
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.customId === "join") {
    if (interaction.member.roles.cache.has('889474498699595826')) {
      await interaction.reply({ content: 'あなたは既に参加済みです', ephemeral: true });
    } else {
      interaction.member.roles.add('889474498699595826')
      await interaction.reply({ content: '参加手続きが完了しました。', ephemeral: true });
      await client.channels.cache.get('889756065531564052').send({
        embeds: [
          {
            title: "📥認証ログ",
            description: `<@${interaction.user.id}> の参加手続きが完了しました。`,
            color: 0x33FF33,
            timestamp: new Date()
          }
        ]
      });
      return;
    }
  }
  if (!interaction.isCommand()) {
    return;
  }
  const command = commands[interaction.commandName];
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '内部エラーが発生しました。管理者にお問い合わせください。',
      ephemeral: true,
    })
  }
});

client.login(process.env.TOKEN);
