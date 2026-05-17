// Used on REGISTER only — enforces @cs.lgu.edu.pk for all new student accounts
const emailDomainMiddleware = (req, res, next) => {
  const { universityEmail } = req.body;

  if (!universityEmail) {
    return res.status(400).json({
      success: false,
      message: 'University email is required.',
    });
  }

  const emailLower = universityEmail.toLowerCase().trim();

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.',
    });
  }

  // Enforce LGU domain
  if (!emailLower.endsWith('@cs.lgu.edu.pk')) {
    return res.status(400).json({
      success: false,
      message: 'Only LGU email addresses are permitted. Your email must end with @cs.lgu.edu.pk',
    });
  }

  next();
};

module.exports = emailDomainMiddleware;