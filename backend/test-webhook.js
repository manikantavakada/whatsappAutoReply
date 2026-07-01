const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function run() {
  // Find the seeded business
  const business = await prisma.business.findFirst();
  if (!business) {
    console.error('Please run database seed first: npm run prisma:seed');
    process.exit(1);
  }

  // Configure dummy testing credentials in database
  const waAppSecret = 'test_secret';
  const waAccessToken = 'test_token';
  const waPhoneNumberId = 'test_phone_number_id';

  await prisma.business.update({
    where: { id: business.id },
    data: {
      waAppSecret,
      waAccessToken,
      waPhoneNumberId,
    },
  });

  console.log(`Configured business "${business.name}" with local testing credentials.`);

  // Simulated WhatsApp customer payload
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry_id',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: waPhoneNumberId,
              },
              contacts: [
                {
                  profile: {
                    name: 'Sarah Connor',
                  },
                  wa_id: '919876543210',
                },
              ],
              messages: [
                {
                  from: '919876543210',
                  id: 'msg_' + Math.random().toString(36).substr(2, 9),
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Hi! Do you have the Classic Black Shirt in size M? How much does it cost?',
                  },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  const bodyStr = JSON.stringify(payload);
  const signature =
    'sha256=' +
    crypto.createHmac('sha256', waAppSecret).update(bodyStr).digest('hex');

  console.log('Sending simulated customer webhook request...');
  try {
    const res = await axios.post(
      `http://localhost:4000/webhook/whatsapp/${business.id}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature,
        },
      },
    );
    console.log('Webhook server responded with:', res.data);
    console.log('\nSuccess! Now check the dashboard:');
    console.log('1. Open http://localhost:3000/dashboard/conversations');
    console.log('2. Select the conversation with "Sarah Connor"');
    console.log(
      '3. You will see the incoming message and the AI\'s generated response matching the configured settings!',
    );
  } catch (err) {
    console.error('Error sending webhook request:', err.message);
    if (err.response) {
      console.error('Server error data:', err.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
