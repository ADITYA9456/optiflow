# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | Fully supported    |
| 0.x.x   | Not supported      |

## Reporting a Vulnerability

The Taskosaur team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

#### 1. Email (Preferred)
Send an email to: **security@taskosaur.com**

Include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

#### 2. GitHub Security Advisories
You can also report vulnerabilities through GitHub's private vulnerability reporting:
1. Go to the [Security tab](https://github.com/Taskosaur/taskosaur/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the security advisory form

### Response Timeline

- **Initial Response**: We will acknowledge your email within 48 hours
- **Detailed Response**: We will send a more detailed response within 7 days indicating the next steps in handling your report
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days of initial report

### What to Expect

After you submit a vulnerability report, here's what happens:

1. **Acknowledgment**: We'll confirm receipt of your vulnerability report
2. **Assessment**: Our security team will assess the vulnerability and determine its impact
3. **Fix Development**: We'll develop a fix for the vulnerability
4. **Testing**: The fix will be thoroughly tested to ensure it doesn't introduce new issues
5. **Release**: We'll release a patch and publish a security advisory
6. **Credit**: We'll publicly credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

#### Environment Variables
- **Never commit sensitive data** to version control
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Rotate secrets regularly in production environments
- Use environment-specific configurations

#### Database Security
- Use strong database passwords
- Enable SSL/TLS for database connections in production
- Regularly update PostgreSQL to the latest stable version
- Configure proper database user permissions

#### Redis Security
- Enable authentication for Redis in production
- Use SSL/TLS for Redis connections when possible
- Configure Redis to bind to specific interfaces, not all interfaces
- Regularly update Redis to the latest stable version

#### Network Security
- Use HTTPS in production environments
- Configure proper CORS settings
- Use a reverse proxy (like Nginx) with security headers
- Enable rate limiting to prevent abuse

### For Developers

#### Code Security
- Always validate and sanitize user input
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization checks
- Follow the principle of least privilege
- Keep dependencies updated

#### API Security
- Implement proper JWT token validation
- Use appropriate HTTP status codes
- Never expose sensitive information in error messages
- Implement rate limiting on API endpoints
- Validate file uploads and restrict file types

## Security Measures in Taskosaur

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing using bcrypt
- Secure password reset functionality

### Data Protection
- Input validation using class-validator
- SQL injection prevention through Prisma ORM
- XSS protection through proper output encoding
- File upload restrictions and validation

### Infrastructure Security
- Environment variable configuration
- Secure cookie settings
- CORS configuration
- Rate limiting for API endpoints

## Security Updates

### Subscribing to Security Updates
- Watch this repository for security advisories
- Subscribe to our security mailing list: security-updates@taskosaur.com
- Follow our GitHub releases for security patches

### Applying Security Updates
1. **Monitor**: Keep track of security advisories and updates
2. **Test**: Test security updates in a staging environment first
3. **Deploy**: Apply security patches to production environments promptly
4. **Verify**: Verify that the security update has been applied successfully

## Security Checklist for Deployment

### Before Deployment
- [ ] All environment variables are properly configured
- [ ] Strong, unique JWT secrets are set
- [ ] Database connection uses SSL/TLS
- [ ] Redis authentication is enabled
- [ ] CORS is properly configured
- [ ] All dependencies are updated to latest secure versions

### Production Environment
- [ ] HTTPS is enabled and properly configured
- [ ] Security headers are set (HSTS, CSP, etc.)
- [ ] Rate limiting is configured
- [ ] File upload restrictions are in place
- [ ] Error messages don't expose sensitive information
- [ ] Logging is configured for security monitoring

### Regular Maintenance
- [ ] Regular security updates and patches
- [ ] Periodic security audits
- [ ] Access control reviews
- [ ] Backup and recovery testing
- [ ] Monitoring and alerting for suspicious activities

## Security Questions

If you have questions about security but don't want to report a vulnerability:
- Email: security-questions@taskosaur.com
- Create a discussion in the [Security category](https://github.com/Taskosaur/taskosaur/discussions/categories/security)

## Hall of Fame

We maintain a list of security researchers who have responsibly disclosed vulnerabilities:

<!-- This section will be updated as we receive and resolve security reports -->
*No vulnerabilities have been reported yet.*

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [NestJS Security Documentation](https://docs.nestjs.com/security/authentication)
- [Next.js Security Guidelines](https://nextjs.org/docs/going-to-production#security-headers)

---

Thank you for helping keep Taskosaur and our users safe!