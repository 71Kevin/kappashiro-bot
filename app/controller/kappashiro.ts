import {
    logger
} from '../lib/logger';
import * as fs from 'fs';
import * as petPetGif from 'pet-pet-gif';
import axios from 'axios';
import * as Discord from 'discord.js';
const client: any = new Discord.Client();
import rabbit from '../lib/rabbitmq';

const kappashiro = {
    bot: async () => {
        try {
            client.on('ready', async () => {
                client.user.setPresence({
                    status: 'online',
                    activity: {
                        name: `${process.env.PREFIX}help`,
                        type: 'PLAYING'
                    }
                })
            });

            let statuses: any = [{
                activity: {
                    name: `${process.env.PREFIX}help`
                },
                type: "PLAYING"
            }];
            let i: number = 0;
            let status: any = statuses[i];

            setInterval(async () => {
                if (!status) {
                    status = statuses[0];
                    i = 0;
                }
                client.user.setPresence(status);
                i++;
            }, 1000 * 60 * 60);

            client.on('message', async (message: {
                content: string;author: {
                    bot: any;
                };channel: {
                    send: (arg0: string | Discord.MessageAttachment) => void;type: string;bulkDelete: (arg0: number, arg1: boolean) => any;
                };reply: (arg0: string) => any;mentions: {
                    users: {
                        first: () => any;
                    };members: {
                        first: () => any;
                    };
                };member: {
                    voice: {
                        channel: any;
                    };
                };react: (arg0: any) => any;
            }) => {
                // await rabbit.send(`${process.env.APP_PORT}`, `${message}`);

                if (message.content.includes(`http`) || message.content.includes(`https`)) {
                    console.log(`message.content: ${message.content}`);
                    return await message.react(`🥒`);
                }

                if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

                // rabbit.consume(process.env.APP_PORT, Number(process.env.CONCURRENCY), (message: any) => {}

                const args: any = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
                const command: string = args.shift().toLowerCase();

                if (command === 'ping') {
                    message.channel.send('pong');

                } else if (command === 'help') {
                    logger.info(`help by ${message.author}`);
                    message.channel.send(`
                bot made by: 🍪 𝑲𝒆𝒗𝒊𝒏 𝒍 𝑻𝒊𝒏𝒆𝒔𝒉#6426
            commands:
            **.purge <number>** - Command to delete messages between the value 1 to 100
            **.avatar <user>** - Command to show someone's profile picture
            **.pet <user>** - Command to show your affection to someone
            **.play <number>** - Work in progress
                `);

                } else if (command === 'purge') {
                    const amount: number = parseInt(args[0]);
                    console.log(`amount: ${amount}`);
                    if (isNaN(amount)) {
                        return await message.reply('Invalid value');
                    } else if (amount <= 0 || amount > 100) {
                        return await message.reply('You must enter a number between 1 and 100');
                    }
                    if (message.channel.type === 'text') await message.channel.bulkDelete(amount, true)

                } else if (command === 'avatar') {
                    let user: any = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
                    let avatar: any = user.avatarURL({
                        dynamic: true,
                        format: "png",
                        size: 1024
                    });
                    let embed: any = new Discord.MessageEmbed()
                        .setColor(`#00000`)
                        .setTitle(`Avatar from ${user.username}`)
                        .setImage(avatar);
                    message.channel.send(embed);

                } else if (command === 'pet') {
                    const member: any = message.mentions.members.first() || message.member;
                    let avatar: string = member.user.displayAvatarURL({
                        format: "jpg"
                    });
                    let animatedGif: string = await petPetGif(avatar);
                    message.channel.send(new Discord.MessageAttachment(animatedGif, 'pet.gif'));

                } else if (command === 'play') {
                    let VC: any = message.member.voice.channel;
                    if (!VC) {
                        return await message.reply("You are not connected to the voice channel")
                    }
                    await VC.join()
                        .then(async (connection: {
                            play: (arg0: string) => any;
                        }) => {
                            console.log(`file: ${args[0]}`);
                            if (args[0] === 'random') {
                                const playfile: any = fs.createWriteStream(`app/resources/media/audios/random.mp3`);
                                await axios({
                                    method: 'get',
                                    url: `${process.env.MYINSTANTS_URL}/?type=file`,
                                    responseType: 'stream',
                                }).then(async response => {
                                    response.data.pipe(playfile);
                                    const dispatcher: any = connection.play(`app/resources/media/audios/random.mp3`);
                                    dispatcher.on("finish", (end: any) => {
                                        // VC.leave()
                                    });
                                });
                            } else {
                                const playfile: any = fs.createWriteStream(`app/resources/media/audios/play.mp3`);
                                await axios({
                                    method: 'get',
                                    url: `${process.env.MYINSTANTS_URL}/?type=file&id=${args[0]}`,
                                    responseType: 'stream',
                                }).then(async response => {
                                    response.data.pipe(playfile);
                                    const dispatcher: any = connection.play(`app/resources/media/audios/play.mp3`);
                                    dispatcher.on("finish", (end: any) => {
                                        // VC.leave()
                                    });
                                });
                            }
                        })
                }
                // rabbit.ack(message);
            });
            client.login(process.env.TOKEN);
        } catch (e) {
            logger.error(e.message);
            // rabbit.ack(message);
        }
    }
};

export default kappashiro;
