import {
    AudioStream,
    // H265NalSplitter,
    H264NalSplitter,
    MediaUdp,
    VideoStream,
} from "@dank074/discord-video-stream";
import { Readable } from "node:stream";
import ffmpeg from "fluent-ffmpeg";
import prism from "prism-media";
import { StreamOutput } from "@dank074/fluent-ffmpeg-multistream-ts";

export let customFfmpegCommand: ffmpeg.FfmpegCommand;

export function customStreamVideo(
    input: string | Readable,
    mediaUdp: MediaUdp,
    includeAudio = true,
) {
    return new Promise<string>((resolve, reject) => {
        const streamOpts = mediaUdp.mediaConnection.streamOptions;

        const videoStream: VideoStream = new VideoStream(
            mediaUdp,
            streamOpts.fps,
            true
        );
        const videoOutput = new H264NalSplitter();
        try {
            var chunkA = "1"
            var chunkB = "1"
            var Xchunk = false
            customFfmpegCommand = ffmpeg(input)
                // .addOption("-loglevel", "0")
                .addInputOption("-fflags", "nobuffer")
                .addInputOption("-flags", "low_delay")
                // .addInputOption("-probesize", "32")
                // .addInputOption("-analyzeduration", "1")
                .addInputOption("-strict", "experimental")
                .inputFormat("mpegts")
                .addOption("-hide_banner")
                .on("end", () => {
                    customFfmpegCommand = undefined;
                    resolve("\n\nData stream from OBS has ended.");
                })
                .on("error", (err, stdout, stderr) => {
                    customFfmpegCommand = undefined;
                    reject("ERRO --> " + err.message);
                })
                .on("stderr", (chunk: string) => {
                    process.stdout.write(chunk + "\n")
                    chunkA = chunk
                    !Xchunk ? Xchunk = !Xchunk : null
                })
            setInterval(() => {
                if (chunkA == chunkB && Xchunk) {
                    reject("Data stream from OBS has ended.")
                } else {
                    chunkB = chunkA
                }
            }, 1000)
            
            customFfmpegCommand
                .addInputOption("-re")
                .output(StreamOutput(videoOutput).url, { end: false })
                .noAudio()
                .videoCodec("copy")
                .format("h264")
                // .outputOptions(["-bsf:v h264_metadata=aud=insert"]);
            
            console.log(StreamOutput(videoOutput).url)

            videoOutput.pipe(videoStream, { end: false });

            if (includeAudio) {
                const audioStream: AudioStream = new AudioStream(mediaUdp);

                // make opus stream
                const opus = new prism.opus.Encoder({
                    channels: 2,
                    rate: 48000,
                    frameSize: 960,
                });
                opus.setBitrate(512000)
                opus.setFEC(true)

                customFfmpegCommand
                    .output(StreamOutput(opus).url, { end: false })
                    .noVideo()
                    .audioChannels(2)
                    .audioFrequency(48000)
                    .format("s16le");

                opus.pipe(audioStream, { end: false });
            }

            if (streamOpts.hardwareAcceleratedDecoding)
                customFfmpegCommand.inputOption("-hwaccel", "auto");

            customFfmpegCommand.run();
        } catch (e) {
            //audioStream.end();
            //videoStream.end();
            customFfmpegCommand = undefined;
            reject("cannot play video " + e.message);
        }
    });
}

type map = {
    [key: string]: string;
};
