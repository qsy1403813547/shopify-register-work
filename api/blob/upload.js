const { put } = require('@vercel/blob')


export default async function handler(req, res) {


  // CORS 设置
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


  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {

    return res.status(200).end();

  }


  if (req.method !== 'POST') {

    return res.status(405).json({
      error: 'Method not allowed'
    });

  }


  try {


    const formData =
      await req.formData();


    const file =
      formData.get('file');


    if (!file) {

      return res.status(400).json({
        error:'No file'
      });

    }


    const blob =
      await put(
        file.name,
        file,
        {
          access:'public'
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