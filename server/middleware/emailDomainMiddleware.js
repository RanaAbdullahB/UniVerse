const emailDomainMiddleware = (req, res, next) => {
  const { universityEmail } = req.body;

  if (!universityEmail) {
    return res.status(400).json({
      success: false,
      message: 'University email is required.',
    });
  }

  const domain = process.env.UNIVERSITY_EMAIL_DOMAIN || 'university.edu';
  const emailLower = universityEmail.toLowerCase().trim();

  if (!emailLower.endsWith(`@${domain}`)) {
    return res.status(400).json({
      success: false,
      message: `Only university email addresses are permitted. Your email must end with @${domain}`,
    });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.',
    });
  }

  next();
};

module.exports = emailDomainMiddleware;
