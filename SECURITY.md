# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of AIVO seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us responsibly.

### How to Report

**Please DO NOT create public GitHub issues for security vulnerabilities.**

Instead, please report security vulnerabilities by emailing:

📧 **security@aivo.education**

### What to Include

When reporting a vulnerability, please include:

1. **Description**: A clear description of the vulnerability
2. **Impact**: The potential impact of the vulnerability
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Affected Components**: Which parts of the system are affected
5. **Suggested Fix**: If you have one, a suggested fix or mitigation

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (depending on severity)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report
2. **Communication**: We will keep you informed about the progress
3. **Credit**: With your permission, we will credit you for the discovery
4. **No Legal Action**: We will not pursue legal action against researchers who follow responsible disclosure

## Security Measures

### Automated Security Scanning

Our CI/CD pipeline includes multiple security scanning tools:

| Tool | Purpose | Frequency |
|------|---------|-----------|
| **CodeQL** | Static Application Security Testing (SAST) | Every push & weekly |
| **Snyk** | Dependency vulnerability scanning | Every push |
| **Trivy** | Container image scanning | Every deployment |
| **Gitleaks** | Secret detection | Every push |
| **TruffleHog** | Secret detection (verified) | Every push |
| **Dependabot** | Automated dependency updates | Weekly |
| **pnpm audit** | Node.js dependency audit | Every push |

### Security Features

- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: TLS 1.3 for data in transit, AES-256 for data at rest
- **Input Validation**: All API inputs validated with Zod schemas
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Security Headers**: Comprehensive HTTP security headers
- **Audit Logging**: All security events are logged

### Infrastructure Security

- **Container Security**: Images scanned for vulnerabilities before deployment
- **Kubernetes Security**: Network policies, pod security standards
- **Secret Management**: Secrets stored in encrypted Kubernetes secrets
- **Database Security**: Encrypted connections, prepared statements

### Code Security

- **Dependency Management**: Regular updates and vulnerability scanning
- **Code Review**: All changes require review before merge
- **Branch Protection**: Protected branches with required checks
- **Signed Commits**: Encouraged for all contributors

## Security Best Practices for Contributors

1. **Never commit secrets**: Use environment variables and `.env.example` files
2. **Keep dependencies updated**: Run `pnpm audit` regularly
3. **Follow secure coding practices**: Input validation, output encoding
4. **Use parameterized queries**: Prevent SQL injection
5. **Validate all inputs**: Never trust user input

## Vulnerability Disclosure History

We maintain a responsible disclosure policy. Past security issues that have been resolved:

| Date | Severity | Description | Status |
|------|----------|-------------|--------|
| - | - | No vulnerabilities disclosed yet | - |

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

## Contact

For security-related inquiries:
- **Email**: security@aivo.education
- **PGP Key**: [Available upon request]

---

Thank you for helping keep AIVO and our users safe!
