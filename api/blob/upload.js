import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';


export const config = {
  api: {
    bodyParser: false,
  },
};


export default async function handler(req, res) {


  // CORS
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://uat-dutties-p.myshopify.com'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );


  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }


  if (req.method !== 'POST') {
    return res.status(405).json({
      error:'Method not allowed'
    });
  }


  try {


    const form =
      formidable({});


    const [fields, files] =
      await form.parse(req);


    const file =
      files.file[0];


    const buffer =
      fs.readFileSync(
        file.filepath
      );


    const blob =
      await put(
        file.originalFilename,
        buffer,
        {
          access:'private',
        }
      );


    return res.status(200).json({

      url: blob.url

    });


  } catch(error) {


    console.error(error);


    return res.status(500).json({

      error:error.message

    });

  }

}