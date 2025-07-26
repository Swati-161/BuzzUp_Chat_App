const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobe = require('ffprobe-static');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

const fs = require('fs');
const path = require('path');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);


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

router.post('/', verifyFirebaseToken, upload.single('file'), async (req, res) => {
  const file = req.file;
  const mime = file.mimetype;

  const response = {
    originalUrl: `/uploads/media/${file.filename}`,
    type: mime.split('/')[0], 
  };

  try {
    if (mime.startsWith('image/')) {
      const thumbPath = `uploads/thumbnails/thumb-${file.filename}.jpg`;
      await sharp(file.path).resize(300).toFile(thumbPath);
      response.thumbnail = `/uploads/thumbnails/thumb-${file.filename}.jpg`;

    } else if (mime.startsWith('video/')) {
        const thumbPath = `uploads/thumbnails/thumb-${file.filename}.jpg`;
        const compressedVideoPath = `uploads/compressed/compressed-${file.filename}`;

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

        await new Promise((resolve, reject) => {
          ffmpeg(file.path)
            .output(compressedVideoPath)
            .outputOptions([
              '-vf', 'scale=640:-1',       
              '-crf', '28',                
              '-preset', 'fast',           
            ])
            .on('end', resolve)
            .on('error', reject)
            .run();  
        });

        response.thumbnail = `/uploads/thumbnails/thumb-${file.filename}.jpg`;
        response.compressedVideo = `/uploads/compressed/compressed-${file.filename}`;
      
      } else if (mime.startsWith('audio/')) {
          await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(file.path, (err, metadata) => {
              if (err) reject(err);
              else {
                response.duration = metadata?.format?.duration || 0;
                response.mediaType = "audio";
                response.type = "media";
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

  const folders = ['media', 'compressed', 'thumbnails'];
  
  for (const folder of folders) {
    const filePath = path.join(__dirname, '../uploads', folder, filename);
    if (fs.existsSync(filePath)) {
      return res.download(filePath); // File found, send download
    }
  }

  // File not found in any folder
  res.status(404).send('File not found');
});

module.exports = router;
