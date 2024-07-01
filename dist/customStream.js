"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customStreamVideo = exports.customFfmpegCommand = void 0;
const discord_video_stream_1 = require("@dank074/discord-video-stream");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const prism_media_1 = __importDefault(require("prism-media"));
const fluent_ffmpeg_multistream_ts_1 = require("@dank074/fluent-ffmpeg-multistream-ts");
function customStreamVideo(input, mediaUdp, includeAudio = true) {
    return new Promise((resolve, reject) => {
        const streamOpts = mediaUdp.mediaConnection.streamOptions;
        const videoStream = new discord_video_stream_1.VideoStream(mediaUdp, streamOpts.fps, true);
        const videoOutput = new discord_video_stream_1.H264NalSplitter();
        try {
            var chunkA = "1";
            var chunkB = "1";
            var Xchunk = false;
            exports.customFfmpegCommand = (0, fluent_ffmpeg_1.default)(input)
                .addInputOption("-fflags", "nobuffer")
                .addInputOption("-flags", "low_delay")
                .addInputOption("-strict", "experimental")
                .inputFormat("mpegts")
                .addOption("-hide_banner")
                .on("end", () => {
                exports.customFfmpegCommand = undefined;
                resolve("\n\nData stream from OBS has ended.");
            })
                .on("error", (err, stdout, stderr) => {
                exports.customFfmpegCommand = undefined;
                reject("ERRO --> " + err.message);
            })
                .on("stderr", (chunk) => {
                process.stdout.write(chunk + "\n");
                chunkA = chunk;
                !Xchunk ? Xchunk = !Xchunk : null;
            });
            setInterval(() => {
                if (chunkA == chunkB && Xchunk) {
                    reject("Data stream from OBS has ended.");
                }
                else {
                    chunkB = chunkA;
                }
            }, 1000);
            exports.customFfmpegCommand
                .addInputOption("-re")
                .output((0, fluent_ffmpeg_multistream_ts_1.StreamOutput)(videoOutput).url, { end: false })
                .noAudio()
                .videoCodec("copy")
                .format("h264");
            console.log((0, fluent_ffmpeg_multistream_ts_1.StreamOutput)(videoOutput).url);
            videoOutput.pipe(videoStream, { end: false });
            if (includeAudio) {
                const audioStream = new discord_video_stream_1.AudioStream(mediaUdp);
                const opus = new prism_media_1.default.opus.Encoder({
                    channels: 2,
                    rate: 48000,
                    frameSize: 960,
                });
                opus.setBitrate(512000);
                opus.setFEC(true);
                exports.customFfmpegCommand
                    .output((0, fluent_ffmpeg_multistream_ts_1.StreamOutput)(opus).url, { end: false })
                    .noVideo()
                    .audioChannels(2)
                    .audioFrequency(48000)
                    .format("s16le");
                opus.pipe(audioStream, { end: false });
            }
            if (streamOpts.hardwareAcceleratedDecoding)
                exports.customFfmpegCommand.inputOption("-hwaccel", "auto");
            exports.customFfmpegCommand.run();
        }
        catch (e) {
            exports.customFfmpegCommand = undefined;
            reject("cannot play video " + e.message);
        }
    });
}
exports.customStreamVideo = customStreamVideo;
