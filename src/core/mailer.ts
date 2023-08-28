import nodemailer from 'nodemailer';

const options = {
  host: process.env.NODEMAILER_HOST || 'smtp.mail.ru',
  port: Number(process.env.NODEMAILER_PORT) || 465,
  secureConnection: true,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }
};

const transport = nodemailer.createTransport(options);

export default transport;