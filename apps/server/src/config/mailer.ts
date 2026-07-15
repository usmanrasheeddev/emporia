// ═══════════════════════════════════════════════════════════════
// Nodemailer Configuration
// SMTP transport with Handlebars template rendering
// ═══════════════════════════════════════════════════════════════

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from '../utils/logger';

/** SMTP transporter configured from environment variables */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/** Template cache to avoid re-reading files */
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Load and compile a Handlebars template from the templates directory.
 * Results are cached in memory for performance.
 */
function getTemplate(templateName: string): HandlebarsTemplateDelegate {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(templateSource);
  templateCache.set(templateName, compiled);
  return compiled;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

/**
 * Send an email using a Handlebars template.
 * @param options - Email recipient, subject, template name, and template data
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const template = getTemplate(options.template);
    const html = template(options.data);

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html,
    });

    logger.info(`📧 Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error(`❌ Email send failed to ${options.to}:`, error);
    // Don't throw — email failure shouldn't crash the request
  }
}

/**
 * Send a raw HTML email without template.
 */
export async function sendRawEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
    logger.info(`📧 Raw email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`❌ Raw email send failed to ${to}:`, error);
  }
}

/** Verify SMTP connection at startup */
export async function verifyMailer(): Promise<void> {
  try {
    await transporter.verify();
    logger.info('✅ SMTP connection verified');
  } catch (error) {
    logger.warn('⚠️ SMTP verification failed — emails may not work:', error);
  }
}
