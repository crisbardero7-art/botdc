// 1. Cargamos la librería para leer el archivo secreto .env
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

// Guardaremos el estado de los enlaces aquí
const invitesCache = new Map();

client.on('ready', async () => {
    console.log(`¡Bot encendido con éxito como ${client.user.tag}!`);
    
    // Al iniciar, el bot escanea y guarda cuántos usos tiene cada link existente
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const currentInvites = await guild.invites.fetch();
            invitesCache.set(guild.id, new Map(currentInvites.map(inv => [inv.code, inv.uses])));
        } catch (err) {
            console.log(`No tengo permisos para leer invitaciones en: ${guild.name}`);
        }
    }
});

client.on('guildMemberAdd', async (member) => {
    try {
        // Obtenemos los links actuales justo después de que entró el usuario
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invitesCache.get(member.guild.id);
        
        // Buscamos cuál link aumentó su contador de usos en la base de datos
        const inviteUsed = newInvites.find(i => oldInvites && i.uses > (oldInvites.get(i.code) || 0));
        
        // === TU ID DE CANAL ===
        // REEMPLAZA ESTO: Pon el ID de tu canal de bienvenidas manteniendo las comillas simples
        const welcomeChannel = member.guild.channels.cache.get('1519204854197784617');
        
        if (!welcomeChannel) return console.log("No encontré el canal de texto.");

        if (inviteUsed) {
            welcomeChannel.send(`¡Hola ${member}! Bienvenido al servidor. Entraste usando la invitación de **${inviteUsed.inviter.username}** (Código: \`${inviteUsed.code}\`).`);
        } else {
            // Si ningún link subió de uso, es porque usaron la URL personalizada (Vanity URL de nivel de servidor)
            welcomeChannel.send(`¡Hola ${member}! Bienvenido al servidor. Entraste usando la URL personalizada del servidor.`);
        }
        
        // Actualizamos la caché para el siguiente usuario que entre
        invitesCache.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));
        
    } catch (error) {
        console.error("Error al procesar la entrada:", error);
    }
});

// 2. Protegemos el token llamándolo desde el archivo oculto .env
client.login(process.env.DISCORD_TOKEN);