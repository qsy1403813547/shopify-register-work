import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const form = formidable({});

    const [, files] = await form.parse(req);

    const file = files.file[0];

    // 读取原图
    const buffer = fs.readFileSync(file.filepath);

    // 压缩图片
    const compressedBuffer = await sharp(buffer)
      .rotate() // 自动修正手机照片方向
      .resize({
        width: 1024,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        mozjpeg: true,
      })
      .toBuffer();

    // 生成唯一文件名
    const pathname = `${crypto.randomUUID()}.jpg`;

    // 上传到 Vercel Blob
    const blob = await put(pathname, compressedBuffer, {
      access: "private",
    });

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}