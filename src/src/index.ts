import { MediaUdp, Streamer, getInputMetadata, inputHasAudio } from "@dank074/discord-video-stream";
import { Client, StageChannel } from "discord.js-selfbot-v13";
import { customFfmpegCommand, customStreamVideo } from "./customStream";
import { FfprobeData } from "fluent-ffmpeg";
import path from "path";
import { readFileSync } from "fs";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

const streamer = new Streamer(new Client());

const config = JSON.parse(readFileSync(path.join(path.dirname(__filename), "..", "config.json"), {  encoding: "utf-8" }))

const ops = {
    videoCodec: "H264",
    readAtNativeFps: false,
    rtcpSenderReportEnabled: false
}

// ready event
streamer.client.on("ready", async () => {
    console.clear()
    console.log(`\nLogged in to ---> ${streamer.client.user.tag}\n`);

    const url = "udp://localhost:65511?ttl=30&pkt_size=4096";
    const guildId = config.serverId
    const chID = config.channelID

    console.log(`Waiting data stream from OBS...`);
    const metadata = await getInputMetadata(url);

    console.log(`Attempting to join voice channel ${guildId}/${chID}`);
    await streamer.joinVoice(guildId, chID);
    // await streamer.client.user.voice.setDeaf(true);
    // await streamer.client.user.voice.setMute(false);

    const streamUdpConn = await streamer.createStream();
    await playVideo(url, streamUdpConn, metadata);

    streamer.stopStream();
    return;
});

// custom code to make it copy the video stream. First we need to get the fps and resolution of existing stream
async function playVideo(video: string, udpConn: MediaUdp, metadata: FfprobeData) {
    let includeAudio = true;

    try {
        console.log(JSON.stringify(metadata))
        const videoStream = metadata.streams.find((value) => value.codec_type === 'video' && value.pix_fmt === 'yuv420p')

        if (!videoStream) {
            console.log("Data stream from OBS has broken.")
            exitHandler()
            return;
        }
        const fps = parseInt(videoStream.avg_frame_rate.split('/')[0]) / parseInt(videoStream.avg_frame_rate.split('/')[1])
        const width = videoStream.width
        const height = videoStream.height
        console.log({ fps, width, height, "profile": videoStream.profile })
        udpConn.mediaConnection.streamOptions = { ...udpConn.mediaConnection.streamOptions, ...ops } as typeof udpConn.mediaConnection.streamOptions
        udpConn.mediaConnection.streamOptions = { fps, width, height }
        includeAudio = true
    } catch (e) {
        console.log(e);
        return;
    }

    try {
        udpConn.mediaConnection.setSpeaking(true);
        udpConn.mediaConnection.setVideoStatus(true);
        await customStreamVideo(video, udpConn, includeAudio);
    } catch (e) {
        console.error(e);
        exitHandler()
    }
}

process.stdin.resume(); // so the program will not close instantly

function exitHandler() {
    streamer.client.destroy()
    customFfmpegCommand?.kill("SIGINT");
    process.exit()
}
// do something when app is closing
process.on('exit', exitHandler.bind(null));
// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null));
process.on('SIGUSR2', exitHandler.bind(null));
// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null));

// login
streamer.client.login(config.token);