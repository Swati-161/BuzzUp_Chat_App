const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobe = require('ffprobe-static');

const fs = require('fs');
const path = require('path');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/media/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  const mime = file.mimetype;

  const response = {
    originalUrl: `/uploads/media/${file.filename}`,
    type: mime.split('/')[0], // image, video, audio
  };

  try {
    if (mime.startsWith('image/')) {
      const thumbPath = `uploads/thumbnails/thumb-${file.filename}.jpg`;
      await sharp(file.path).resize(300).toFile(thumbPath);
      response.thumbnail = `/uploads/thumbnails/thumb-${file.filename}.jpg`;

    } else if (mime.startsWith('video/')) {
      const thumbPath = `uploads/thumbnails/thumb-${file.filename}.jpg`;
      await new Promise((resolve, reject) => {
        ffmpeg(file.path)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            timestamps: ['50%'],
            filename: `thumb-${file.filename}.jpg`,
            folder: 'uploads/thumbnails',
            size: '300x?',
          });
      });
      response.thumbnail = `/uploads/thumbnails/thumb-${file.filename}.jpg`;

    } else if (mime.startsWith('audio/')) {
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file.path, (err, metadata) => {
          if (err) reject(err);
          else {
            response.duration = metadata.format.duration;
            resolve();
          }
        });
      });
    }

    res.status(200).json(response);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/media/', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath); // This forces the browser to download
  } else {
    res.status(404).send('File not found');
  }
});

module.exports = router;
