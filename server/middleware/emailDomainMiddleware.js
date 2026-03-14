// Used on REGISTER only — enforces @lgu.edu.pk for all new accounts
const emailDomainMiddleware = (req, res, next) => {
  const { universityEmail } = req.body;

  if (!universityEmail) {
    return res.status(400).json({
      success: false,
      message: 'University email is required.',
    });
  }

  const domain = process.env.UNIVERSITY_EMAIL_DOMAIN || '@cs.lgu.edu.pk';
  const emailLower = universityEmail.toLowerCase().trim();

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.',
    });
  }

  if (!emailLower.endsWith(`@${domain}`)) {
    return res.status(400).json({
      success: false,
      message: `Only LGU email addresses are permitted. Your email must end with @${domain}`,
    });
  }

  next();
};

module.exports = emailDomainMiddleware;