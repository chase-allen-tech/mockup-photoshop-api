const util = require("util");
const fs = require('fs');
const axios = require('axios');

const buildJWTConfig = async () => {
    const readFile = util.promisify(fs.readFile);
    const data = await readFile("private.key");
    let privateKey = data.toString();

    return {
        clientId: process.env.ADOBE_CLIENT_ID,
        clientSecret: process.env.ADOBE_CLIENT_SECRET,
        technicalAccountId: process.env.ADOBE_ACCOUNT_ID,
        orgId: process.env.ADOBE_ORG_ID,
        metaScopes: ["ent_ccas_sdk"],
        privateKey
    }
}

const uploadFileToS3 = async (s3, fileName) => {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync('./uploads/' + fileName);
        console.log('[file]', fileContent.length);

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: process.env.S3_UPLOAD_KEY,
            Body: fileContent
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.log('there is error in file upload');
                reject(err);
            }
            console.log(`File uploaded successfully. ${data.Location}`);
            resolve(data.Location);
        })
    })

}


const processImage = async (header, psdUrl, pngUrl, putUrl) => {
    const payload = {
        "inputs": [{
            "href": psdUrl,
            "storage": "external"
        }],
        "options": {
            "layers": [{
                "name": "LOGO",
                "smartObject": {
                    "layers": [
                        {
                            "name": "LOGO",
                            "input": {
                                "href": pngUrl,
                                "storage": "external"
                            }
                        }
                    ]
                }
            }]
        },
        "outputs": [{
            "storage": "external",
            "href": putUrl,
            "quality": 7,
            "type": "image/jpeg",
            "overwrite": true,
            "compression": "large",
            "width": 20
        }]
    }

    const result = await axios.post(process.env.ADOBE_IMAGE_ENDPOINT + '/smartObjectV2', payload, {
        headers: header
    });

    const resultUrl = result.data._links.self.href;
    return resultUrl;
}

const processImageResize = async (header, inUrl, jpgUrl, outUrl) => {
    const payload = {
        "inputs": [
            {
                "href": inUrl,
                "storage": "external"
            }
        ],
        "options": {
            "manageMissingFonts": "useDefault",
            "document": {
                "imageSize": {
                    "width": 150,
                    "height": 120
                }
            },
            "layers": [
                {
                    "name": "LOGO",
                    "input": {
                        "href": jpgUrl,
                        "storage": "external"
                    }
                }
            ]
        },
        "outputs": [
            {
                "href": outUrl,
                "type": "image/jpeg",
                "overwrite": true,
                "storage":"external",
              }
          ]
    }

    let result = {};
    try {
        result = await axios.post(process.env.ADOBE_IMAGE_ENDPOINT + '/documentOperations', payload, { headers: header });
    } catch (err) {
        console.log('[AAA]', err.response.data.invalidParams);
    }


    const resultUrl = result.data._links.self.href;
    return resultUrl;
    return true;
}

module.exports = {buildJWTConfig, uploadFileToS3, processImage, processImageResize};