require("dotenv/config");

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  REST,
  Routes,
} = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API = process.env.DAEMON_API_URL || "http://localhost:3002";

if (!TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN in service/.env");
  process.exit(1);
}

const DAEMON_CHOICES = [
  { name: "Wisp", value: "wisp" },
  { name: "Ember", value: "ember" },
  { name: "Tide", value: "tide" },
  { name: "Lattice", value: "lattice" },
  { name: "Murmur", value: "murmur" },
  { name: "Phantom", value: "phantom" },
  { name: "Pulse", value: "pulse" },
  { name: "Sigil", value: "sigil" },
];

const commands = [
  new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check daemon service status"),
  new SlashCommandBuilder()
    .setName("catalog")
    .setDescription("List all 8 daemon forms"),
  new SlashCommandBuilder()
    .setName("attach")
    .setDescription("Attach a daemon to yourself")
    .addStringOption((opt) =>
      opt
        .setName("daemon")
        .setDescription("Which daemon to attach")
        .setRequired(true)
        .addChoices(...DAEMON_CHOICES)
    ),
  new SlashCommandBuilder()
    .setName("detach")
    .setDescription("Detach your current daemon"),
  new SlashCommandBuilder()
    .setName("me")
    .setDescription("Show your current daemon attachment"),
];

function userParam(discordId) {
  return "userId=discord:" + discordId;
}

async function api(path, options) {
  const res = await fetch(API + path, options);
  return res.json();
}

// --- Command handlers ---

async function handleHealth(interaction) {
  const data = await api("/daemons/health");
  const embed = new EmbedBuilder()
    .setTitle("Daemon Service Health")
    .setColor(data.status === "ok" ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: "Status", value: data.status, inline: true },
      { name: "Version", value: data.version || "?", inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}

async function handleCatalog(interaction) {
  const data = await api("/daemons/catalog");
  const list = data.daemons
    .map((d) => `**${d.name}** (\`${d.id}\`)`)
    .join("\n");
  const embed = new EmbedBuilder()
    .setTitle("Daemon Catalog")
    .setColor(0x7c3aed)
    .setDescription(list)
    .setFooter({ text: `${data.daemons.length} daemons available` });
  await interaction.reply({ embeds: [embed] });
}

async function handleAttach(interaction) {
  const daemonId = interaction.options.getString("daemon");
  const data = await api(
    "/daemons/attach?" + userParam(interaction.user.id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daemonId }),
    }
  );
  if (data.error) {
    await interaction.reply({ content: `Error: ${data.error}`, ephemeral: true });
    return;
  }
  const embed = new EmbedBuilder()
    .setTitle("Daemon Attached!")
    .setColor(0x00ff00)
    .addFields(
      { name: "Daemon", value: data.attachment.daemonId, inline: true },
      { name: "Anchor", value: data.attachment.anchorMode, inline: true },
      { name: "Scale", value: String(data.attachment.scale), inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}

async function handleDetach(interaction) {
  const data = await api(
    "/daemons/detach?" + userParam(interaction.user.id),
    { method: "POST" }
  );
  if (data.error) {
    await interaction.reply({ content: `Error: ${data.error}`, ephemeral: true });
    return;
  }
  const msg = data.detached
    ? "Your daemon has been detached."
    : "You had no daemon attached.";
  await interaction.reply({ content: msg });
}

async function handleMe(interaction) {
  const data = await api(
    "/daemons/me?" + userParam(interaction.user.id)
  );
  if (data.error) {
    await interaction.reply({ content: `Error: ${data.error}`, ephemeral: true });
    return;
  }
  if (!data.attachment) {
    await interaction.reply({ content: "You don't have a daemon attached. Use `/attach` to get one!" });
    return;
  }
  const a = data.attachment;
  const embed = new EmbedBuilder()
    .setTitle("Your Daemon")
    .setColor(0x7c3aed)
    .addFields(
      { name: "Daemon", value: a.daemonId, inline: true },
      { name: "Anchor", value: a.anchorMode, inline: true },
      { name: "Scale", value: String(a.scale), inline: true },
      { name: "Attached", value: a.attachedAt, inline: false }
    );
  await interaction.reply({ embeds: [embed] });
}

const HANDLERS = {
  health: handleHealth,
  catalog: handleCatalog,
  attach: handleAttach,
  detach: handleDetach,
  me: handleMe,
};

// --- Bot setup ---

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Daemon Assistant online as ${client.user.tag}`);

  const rest = new REST().setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands.map((c) => c.toJSON()),
    });
    console.log("Slash commands registered globally");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const handler = HANDLERS[interaction.commandName];
  if (!handler) return;

  try {
    await handler(interaction);
  } catch (err) {
    console.error(`Error handling /${interaction.commandName}:`, err);
    const reply = { content: "Something went wrong talking to the daemon service.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(TOKEN);
