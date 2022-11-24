
const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const CatLoggr = require('cat-loggr');


const client = new Discord.Client();
const log = new CatLoggr();


client.commands = new Discord.Collection();


if (config.debug === true) client.on('debug', stream => log.debug(stream)); 
client.on('warn', message => log.warn(message));
client.on('error', error => log.error(error));


const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); 
for (const file of commandFiles) {
	const command = require(`./commands/${file}`); 
    log.init(`Loaded command ${file.split('.')[0] === command.name ? file.split('.')[0] : `${file.split('.')[0]} as ${command.name}`}`); // Logging to console
	client.commands.set(command.name, command); 
};


client.login(config.token);

client.once('ready', () => {
	log.info(`I am logged in as ${client.user.tag} to Discord!`); 
    client.user.setActivity(`${config.prefix}help • ${client.user.username.toUpperCase()}`, { type: "LISTENING" }); 

});


client.on('message', (message) => {
	if (!message.content.startsWith(config.prefix)) return; 

    
	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

    
	if (config.command.notfound_message === true && !client.commands.has(command)) {
        return message.channel.send(
            new Discord.MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Unknown command :(')
            .setDescription(`Sorry, but I cannot find the \`${command}\` command!`)
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        );
    };

    
	try {
		client.commands.get(command).execute(message, args); 
	} catch (error) {
		log.error(error); 

        
		if (config.command.error_message === true) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Error occurred!')
                .setDescription(`An error occurred while executing the \`${command}\` command!`)
                .addField('Error', `\`\`\`js\n${error}\n\`\`\``)
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            );
        };
	};
});
