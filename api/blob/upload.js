import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const { filename, imageBase64 } = req.body;

  const buffer = Buffer.from(
    imageBase64,
    'base64'
  );

  const blob = await put(
    filename,
    buffer,
    {
      access: 'public',
    }
  );

  res.status(200).json({
    url: blob.url,
  });
}