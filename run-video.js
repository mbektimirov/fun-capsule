const { spawn } = require('child_process');

function play(display, file, onClose) {
  const vlc = spawn('cvlc', ['--fullscreen', '--play-and-exit', file], {
    env: { DISPLAY: display },
  });

  vlc.stderr.on('data', data => {
    console.log(`stderr: ${data}`);
  });

  vlc.on('close', code => {
    if (onClose) {
      onClose();
    }

    console.log(`child process exited with code ${code}`);
  });
}

function captureVideo() {
  // ffmpeg -f video4linux2 -framerate 90 -input_format yuv420p -i /dev/video0 -c:v copy output.avi
  const captures = [1, 2, 3].map(device =>
    spawn(
      'ffmpeg',
      `-f video4linux2 -framerate 48 -input_format yuv420p -i /dev/video${device} -c:v copy -y output-${device}.avi`.split(
        ' '
      )
    )
  );

  return captures;
}

const captures = captureVideo();

play(':0.1', 'video-vertical-short.webm', () => {
  captures.forEach(c => c.kill());
});
play(':0.0', 'video1.mp4');
