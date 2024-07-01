"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_video_stream_1 = require("@dank074/discord-video-stream");
const discord_js_selfbot_v13_1 = require("discord.js-selfbot-v13");
const customStream_1 = require("./customStream");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const streamer = new discord_video_stream_1.Streamer(new discord_js_selfbot_v13_1.Client());
const config = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(path_1.default.dirname(__filename), "..", "config.json"), { encoding: "utf-8" }));
const ops = {
    videoCodec: "H264",
    readAtNativeFps: false,
    rtcpSenderReportEnabled: false
};
streamer.client.on("ready", () => __awaiter(void 0, void 0, void 0, function* () {
    console.clear();
    console.log(`\nLogged in to ---> ${streamer.client.user.tag}\n`);
    const url = "udp://localhost:65511?ttl=30&pkt_size=4096";
    const guildId = config.serverId;
    const chID = config.channelID;
    console.log(`Waiting data stream from OBS...`);
    const metadata = yield (0, discord_video_stream_1.getInputMetadata)(url);
    console.log(`Attempting to join voice channel ${guildId}/${chID}`);
    yield streamer.joinVoice(guildId, chID);
    const streamUdpConn = yield streamer.createStream();
    yield playVideo(url, streamUdpConn, metadata);
    streamer.stopStream();
    return;
}));
function playVideo(video, udpConn, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        let includeAudio = true;
        try {
            console.log(JSON.stringify(metadata));
            const videoStream = metadata.streams.find((value) => value.codec_type === 'video' && value.pix_fmt === 'yuv420p');
            if (!videoStream) {
                console.log("Data stream from OBS has broken.");
                exitHandler();
                return;
            }
            const fps = parseInt(videoStream.avg_frame_rate.split('/')[0]) / parseInt(videoStream.avg_frame_rate.split('/')[1]);
            const width = videoStream.width;
            const height = videoStream.height;
            console.log({ fps, width, height, "profile": videoStream.profile });
            udpConn.mediaConnection.streamOptions = Object.assign(Object.assign({}, udpConn.mediaConnection.streamOptions), ops);
            udpConn.mediaConnection.streamOptions = { fps, width, height };
            includeAudio = true;
        }
        catch (e) {
            console.log(e);
            return;
        }
        try {
            udpConn.mediaConnection.setSpeaking(true);
            udpConn.mediaConnection.setVideoStatus(true);
            yield (0, customStream_1.customStreamVideo)(video, udpConn, includeAudio);
        }
        catch (e) {
            console.error(e);
            exitHandler();
        }
    });
}
process.stdin.resume();
function exitHandler() {
    streamer.client.destroy();
    customStream_1.customFfmpegCommand === null || customStream_1.customFfmpegCommand === void 0 ? void 0 : customStream_1.customFfmpegCommand.kill("SIGINT");
    process.exit();
}
process.on('exit', exitHandler.bind(null));
process.on('SIGINT', exitHandler.bind(null));
process.on('SIGUSR1', exitHandler.bind(null));
process.on('SIGUSR2', exitHandler.bind(null));
process.on('uncaughtException', exitHandler.bind(null));
streamer.client.login(config.token);
