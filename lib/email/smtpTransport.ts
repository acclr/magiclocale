import env from '../env';

/** Nodemailer transport options shared by app email and NextAuth EmailProvider. */
export function getSmtpTransportOptions() {
  const port = env.smtp.port;
  const secure = port === 465 || port === 2465;

  return {
    host: env.smtp.host,
    port,
    secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.password,
    },
  };
}
